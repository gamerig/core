import { IEngine } from '../engine/Engine';
import { LoaderResource } from './loader/LoaderResource';

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
  /**
   * Globally cached resources
   */
  private _resourceCache: Record<string, LoaderResource> = {};

  constructor(private readonly _engine: IEngine) {}

  add(key: string, resource: LoaderResource): void {
    this._resourceCache[key] = resource;
  }

  has(key: string): boolean {
    return this._resourceCache[key] !== undefined;
  }

  get(key: string): LoaderResource | undefined {
    return this._resourceCache[key];
  }

  remove(key: string | string[]): void {
    const keys = Array.isArray(key) ? key : [key];
    keys.filter(this.has).forEach((k) => {
      delete this._resourceCache[k];
    });
  }

  clear(): void {
    this._resourceCache = {};
  }

  destroy(): void {
    this.clear();
  }

  get resources(): Record<string, LoaderResource> {
    return this._resourceCache;
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace IResourceManager {
  export const KEY = Symbol('ResourceManager');
}
