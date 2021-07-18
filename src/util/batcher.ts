import EventEmitter from 'eventemitter3';

export interface BatcherOptions {
  maxSize: number;
  maxTime: number;
}

export default class Batcher<T = any> extends EventEmitter {
  maxTime: number;
  maxSize: number;

  private _lastFlush: number;
  private _timeout: NodeJS.Timeout;
  private _arr: T[] = [];

  constructor(options: BatcherOptions) {
    super();
    this.maxTime = options.maxTime;
    this.maxSize = options.maxSize;

    this._lastFlush = Date.now();
  }

  _flush() {
    clearTimeout(this._timeout);
    this._lastFlush = Date.now();

    this.emit('batch', this._arr);
    this._arr = [];
  }

  add(data: T) {
    this._arr.push(data);

    if (this._arr.length === this.maxSize) {
      this._flush();
    } else if (this.maxTime != null && this._arr.length === 1) {
      this._timeout = setTimeout(() => {
        return this._flush();
      }, this.maxTime);
    }
  }
}
