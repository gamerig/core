import { Engine } from '../engine';
import { MessageBus } from '../messaging/MessageBus';
import { SceneManager } from './SceneManager';
import { SceneState, SceneStatus } from './SceneState';

export abstract class Scene {
  readonly engine: Engine;

  readonly events: MessageBus;

  readonly state: SceneState;

  readonly scenes: SceneManager;

  constructor(readonly name: string, engine: Engine, manager: SceneManager) {
    this.engine = engine;
    this.events = engine.messaging;
    this.scenes = manager;

    this.state = new SceneState(this.name, this, SceneStatus.Pending, false);
  }

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
