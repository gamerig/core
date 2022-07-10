import { IEngine } from '../engine/Engine';
import { IMessageBus } from '../messaging/MessageBus';
import { ILoader } from '../resource/loader/Loader';
import { LoaderResource } from '../resource/loader/LoaderResource';
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

  // oficially recognized core properties of the scene
  // can be extended by other packages via module augmentation
  readonly scenes: ISceneManagerProxy;
  readonly events: IMessageBus;
  readonly loader: ILoader;
  readonly resources: { [key: string]: LoaderResource };
}

export abstract class Scene implements Scene {
  private _state!: SceneState;

  constructor(private readonly _key: string, private readonly _engine: IEngine) {
    this._state = new SceneState(_key, SceneStatus.Pending, false);
  }

  get state(): SceneState {
    return this._state;
  }

  get key(): string {
    return this._key;
  }

  get engine(): IEngine {
    return this._engine;
  }
}
