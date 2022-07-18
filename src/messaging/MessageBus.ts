import { event, EventEmitter2, Listener } from 'eventemitter2';

export type EventListener = {
  event: string | symbol | event[];
  listener: (...args: any[]) => void;
  off: () => void;
};

export class MessageBus {
  private _emitter: EventEmitter2;

  constructor() {
    this._emitter = new EventEmitter2({
      wildcard: true,
      maxListeners: 1000,
    });
  }

  publish = (evt: string | symbol | event[], ...args: any[]): void => {
    this._emitter.emit(evt, ...args);
  };

  subscribe = (
    evt: string | symbol | event[],
    callback: (...args: any[]) => void,
  ): EventListener => {
    return this._subscribe(evt, callback, false);
  };

  subscribeAsync = (
    evt: string | symbol | event[],
    callback: (...args: any[]) => void,
  ): EventListener => {
    return this._subscribe(evt, callback, true);
  };

  destroy = (): void => {
    this._emitter.removeAllListeners();
  };

  private _subscribe(
    evt: string | symbol | event[],
    callback: (...args: any[]) => void,
    async = false,
  ): EventListener {
    const { event, listener, off } = this._emitter.on(evt, callback, {
      objectify: true,
      async,
    }) as Listener;

    return { event, listener, off };
  }
}
