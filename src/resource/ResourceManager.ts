import { IEngine } from '../engine/Engine';
import { EventListener, IMessageBus } from '../messaging/MessageBus';
import { ILoader } from './loader/Loader';
import { LoaderEvent } from './loader/LoaderEvent';
import { LoaderResource } from './loader/LoaderResource';
import { ResourceEvent } from './ResourceEvent';

export interface IResourceManager {
  add(key: string, resource: LoaderResource): void;
  has(key: string): boolean;
  get(key: string): LoaderResource | undefined;
  remove(key: string): void;
  clear(): void;
  destroy(): void;

  resources: Record<string, LoaderResource>;
}

export class ResourceManager implements IResourceManager {
  private _cache: Record<string, LoaderResource> = {};

  private readonly _events: IMessageBus;

  private _loaderListeners: EventListener[] = [];

  constructor(private readonly _engine: IEngine) {
    this._events = this._engine.messaging;

    this._loaderListeners.push(
      this._events.subscribe(LoaderEvent.Loaded, (_loader: ILoader, resource: LoaderResource) => {
        this.add(resource.name, resource);
      }),
    );
  }

  add(key: string, resource: LoaderResource): void {
    this._cache[key] = resource;
    this._events.publish(ResourceEvent.Added, key, resource);
  }

  has(key: string): boolean {
    return this._cache[key] !== undefined;
  }

  get(key: string): LoaderResource | undefined {
    return this._cache[key];
  }

  remove(key: string | string[]): void {
    const keys = Array.isArray(key) ? key : [key];
    keys.forEach((k) => {
      const resource = this._cache[k];
      if (resource) {
        delete this._cache[k];
        this._events.publish(ResourceEvent.Removed, k, resource);
      }
    });
  }

  clear(): void {
    this._events.publish(ResourceEvent.Cleared, this.resources);
    this._loaderListeners = [];
    this._cache = {};
  }

  destroy(): void {
    this._loaderListeners.forEach((listener) => listener.off());
    this.clear();
  }

  get resources(): Record<string, LoaderResource> {
    return this._cache;
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace IResourceManager {
  export const KEY = Symbol('ResourceManager');
}
