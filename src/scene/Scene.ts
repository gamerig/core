import { IMessageBus } from '../messaging/MessageBus';
import { ILoader } from '../resource/loader/Loader';
import { LoaderResource } from '../resource/loader/LoaderResource';
import { IResourceManager } from '../resource/ResourceManager';
import { ISceneManagerProxy } from './SceneManagerProxy';
import { SceneState, SceneStatus } from './SceneState';

export interface Scene {
  init?(): void;
  load?(): Promise<void>;
  create?(data?: any): void;
  pause?(): void;
  sleep?(): void;
  resume?(data?: any): void;
  wakeup?(data?: any): void;
  stop?(): void;
  destroy?(): void;

  update?(delta: number): void;
  render?(): void;
}

export abstract class Scene implements Scene {
  private _state!: SceneState;
  private _injectionMap: Map<string | symbol, any> = new Map();

  constructor(private readonly _key: string) {
    this._state = new SceneState(_key, SceneStatus.Pending, false);
  }

  get scenes(): ISceneManagerProxy {
    return this.get<ISceneManagerProxy>(ISceneManagerProxy.KEY);
  }

  get messaging(): IMessageBus {
    return this.get<IMessageBus>(IMessageBus.KEY);
  }

  get loader(): ILoader {
    return this.get<ILoader>(ILoader.KEY);
  }

  get resources(): Record<string, LoaderResource> {
    return this.get<IResourceManager>(IResourceManager.KEY).resources;
  }

  get key(): string {
    return this._key;
  }

  get state(): SceneState {
    return this._state;
  }

  inject = (key: string | symbol, value: any): void => {
    this._injectionMap.set(key, value);
  };

  get = <T>(key: string | symbol): T => {
    const provider = this._injectionMap.get(key);
    if (typeof provider === 'function') {
      return provider() as T;
    }

    return provider as T;
  };
}
