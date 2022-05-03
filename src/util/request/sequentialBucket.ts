import { available as redisAvailable, client } from '../../db/redis';

/** @hidden */
export interface MinimalLatencyRef {
  /** Interval between consuming tokens. */
  latency: number;
  offset?: number;
}

/** @hidden */
type CallbackFunction = (callback: () => void) => unknown;

/**
 * Ratelimit requests and release in sequence.
 * @private
 */
export default class SequentialBucket {
  /** The route the bucket is for. */
  route: string;
  /** How many tokens the bucket can consume in the current interval. */
  limit: number;
  /** Whether the queue is being processed. */
  processing = false;
  /** How many tokens the bucket has left in the current interval. */
  remaining: number;
  /** Timestamp of next reset. */
  reset = 0;

  private latencyRef: MinimalLatencyRef;
  private _queue: CallbackFunction[] = [];
  private processingTimeout: any;
  private last?: number;

  /**
   * @param route The route this bucket is for
   * @param limit The max number of tokens the bucket can consume per interval
   * @param latencyRef The latency reference
   */
  constructor(route: string, limit: number, latencyRef: MinimalLatencyRef = { latency: 0 }) {
    this.route = route;
    this.limit = this.remaining = limit;
    this.latencyRef = latencyRef;
  }

  get redisKey() {
    return `bucket:${this.route}`;
  }

  async setValues({ remaining, reset }: { remaining?: number; reset?: number } = {}) {
    const args: any[] = [];

    if (remaining !== undefined) {
      args.push('remaining', this.remaining);
      this.remaining = remaining;
    }

    if (reset !== undefined) {
      args.push('reset', this.reset);
      this.reset = reset;
    }

    if (redisAvailable) {
      await client.hset(this.redisKey, ...args);
      if (reset !== undefined) {
        const now = Date.now();
        const offset = this.latencyRef.latency + (this.latencyRef.offset || 0);
        await client.pexpire(this.redisKey, reset - (now - offset));
      }
    }
  }

  async decreaseRemaining() {
    if (redisAvailable) {
      this.remaining = await client.hincrby(this.redisKey, 'remaining', -1);
    } else --this.remaining;
  }

  async sync() {
    if (redisAvailable) {
      const [remaining, reset] = await client.hmget(this.redisKey, 'remaining', 'reset');
      if (remaining) this.remaining = parseInt(remaining, 10);
      if (reset) this.reset = parseInt(reset, 10);
    }
  }

  /**
   * Checks the bucket and runs through the functions.
   * @param override Whether to override the processing property
   */
  async check(override = false) {
    if (this._queue.length === 0) {
      if (this.processing) {
        clearTimeout(this.processingTimeout);
        this.processing = false;
      }
      return;
    }
    if (this.processing && !override) {
      return;
    }
    await this.sync();
    const now = Date.now();
    const offset = this.latencyRef.latency + (this.latencyRef.offset || 0);
    if (!this.reset || this.reset < now - offset) {
      // When the bucket expires, leave the redis to expire as well
      this.reset = now - offset;
      this.remaining = this.limit;
    }
    this.last = now;
    if (this.remaining <= 0) {
      this.processingTimeout = setTimeout(() => {
        this.processing = false;
        this.check(true);
      }, Math.max(0, (this.reset || 0) - now + offset) + 1);
      return;
    }
    await this.decreaseRemaining();
    this.processing = true;
    (this._queue.shift() as CallbackFunction)(() => {
      if (this._queue.length > 0) {
        this.check(true);
      } else {
        this.processing = false;
      }
    });
  }

  /**
   * Queue something in the SequentialBucket
   * @param func A function to call when a token can be consumed. The function will be passed a callback argument, which must be called to allow the bucket to continue to work
   */
  queue(func: CallbackFunction, short = false) {
    if (short) {
      this._queue.unshift(func);
    } else {
      this._queue.push(func);
    }
    this.check();
  }

  toString() {
    return '[SequentialBucket]';
  }
}
