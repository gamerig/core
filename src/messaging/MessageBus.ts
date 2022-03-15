import { event, EventEmitter2, Listener } from 'eventemitter2';

export type EventListener = {
  event: string | symbol | event[];
  listener: (...args: any[]) => void;
  off: () => void;
};

export interface IMessageBus {
  publish(evt: string | symbol | event[], ...args: any[]): void;
  subscribe(evt: string | symbol | event[], callback: (...args: any[]) => void): EventListener;
  subscribeAsync(evt: string | symbol | event[], callback: (...args: any[]) => void): EventListener;
}

export class MessageBus implements IMessageBus {
  private _emitter: EventEmitter2;

  constructor() {
    this._emitter = new EventEmitter2({
      wildcard: true,
      maxListeners: 1000,
    });
  }

  /**
   * Emit the event
   * @param evt
   * @param args
   */
  publish = (evt: string | symbol | event[], ...args: any[]): void => {
    this._emitter.emit(evt, ...args);
  };

  /**
   * Subscribe to the event synchronously
   * When the event is emitted, the callbacks will be called immediately and synchronously
   * in the order they were subscribed
   *
   * @param evt
   * @param callback
   * @returns
   */
  subscribe = (
    evt: string | symbol | event[],
    callback: (...args: any[]) => void,
  ): EventListener => {
    return this._subscribe(evt, callback, false);
  };

  /**
   * Subscribe to the event asynchronously
   * Callbacks will be called after the current tick/loop ends and won't block the main thread
   *
   * @param evt
   * @param callback
   * @returns
   */
  subscribeAsync = (
    evt: string | symbol | event[],
    callback: (...args: any[]) => void,
  ): EventListener => {
    return this._subscribe(evt, callback, true);
  };

  /**
   * Clean up message bus
   */
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

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace IMessageBus {
  export const KEY = Symbol('MessageBus');
}
