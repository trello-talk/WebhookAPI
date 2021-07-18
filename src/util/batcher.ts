import EventEmitter from 'eventemitter3';

interface BatcherOptions {
  maxSize?: number;
  maxTime?: number;
}

export default class Batcher<T = any> extends EventEmitter {
  maxTime: number;
  maxSize: number;

  private _lastFlush: number;
  private _timeout: NodeJS.Timeout;
  private _arr: T[] = [];
  private _promise: Promise<unknown>;
  private _resolve: (value?: unknown) => void;

  constructor(options: BatcherOptions = {}) {
    super();
    this.maxTime = options.maxTime;
    this.maxSize = options.maxSize;

    this._resetPromise();

    this._lastFlush = Date.now();
  }

  _resetPromise() {
    return (this._promise = new Promise((res) => {
      return (this._resolve = res);
    }));
  }

  _flush() {
    clearTimeout(this._timeout);
    this._lastFlush = Date.now();

    this._resolve();

    this.emit('batch', this._arr);
    this._arr = [];
    return this._resetPromise();
  }

  add(data: T) {
    var ret;

    this._arr.push(data);

    ret = this._promise;

    if (this._arr.length === this.maxSize) {
      this._flush();
    } else if (this.maxTime != null && this._arr.length === 1) {
      this._timeout = setTimeout(() => {
        return this._flush();
      }, this.maxTime);
    }

    return ret;
  }
}
