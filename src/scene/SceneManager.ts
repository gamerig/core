import { Renderable } from '../common/interface/Renderable';
import { Updateable } from '../common/interface/Updateable';
import { OpQueueItem, Type } from '../common/types';
import { IEngine } from '../engine/Engine';
import { IMessageBus } from '../messaging/MessageBus';
import { Scene } from './Scene';
import { SceneEvent } from './SceneEvent';
import { ISceneManagerProxy, SceneManagerProxy } from './SceneManagerProxy';
import { SceneStatus } from './SceneState';

export interface ISceneManager {
  add(key: string, ctor: Type<Scene>, autostart?: boolean, data?: any): void;
  remove(key: string): void;
  start(key: string, data?: any): void;
  restart(key: string, data?: any): void;
  pause(key: string): void;
  sleep(key: string): void;
  stop(key: string): void;
  shutdown(key: string): void;

  // render order management methods
  bringToTop(key: string): void;
  sendToBack(key: string): void;
  moveUp(key: string): void;
  moveDown(key: string): void;
  moveAbove(key: string, targetKey: string): void;
  moveBelow(key: string, targetKey: string): void;
  swap(key: string, targetKey: string): void;
}

export class SceneManager implements ISceneManager, Updateable, Renderable {
  private _queue: OpQueueItem[] = [];

  private _lookup: Map<string, Scene> = new Map();

  /**
   * List of all registered scenes(states)
   * Only some of these can be active, update and render order depends on the order of the array
   * Updates are done from top scenes to bottom and renders viceversa
   */
  private _scenes: Scene[] = [];

  private _messaging: IMessageBus;

  constructor(private readonly _engine: IEngine) {
    this._messaging = this._engine.messaging;
  }

  add(key: string, ctor: Type<Scene>, autostart = false, data: any = {}): void {
    this.enqueueOp({ fn: this._add, args: [key, ctor, autostart, data] });
  }

  remove(key: string): void {
    this.enqueueOp({ fn: this._remove, args: [key] });
  }

  start(key: string, data: any = {}): void {
    this.enqueueOp({ fn: this._start, args: [key, data] });
  }

  restart(key: string, data: any = {}): void {
    this.stop(key);
    this.start(key, data);
  }

  pause(key: string): void {
    this.enqueueOp({ fn: this._pause, args: [key] });
  }

  sleep(key: string): void {
    this.enqueueOp({ fn: this._sleep, args: [key] });
  }

  stop(key: string): void {
    this.enqueueOp({ fn: this._stop, args: [key] });
  }

  shutdown(key: string): void {
    this.enqueueOp({ fn: this._shutdown, args: [key] });
  }

  bringToTop(key: string): void {
    this.enqueueOp({ fn: this._bringToTop, args: [key] });
  }

  sendToBack(key: string): void {
    this.enqueueOp({ fn: this._sendToBack, args: [key] });
  }

  moveUp(key: string): void {
    this.enqueueOp({ fn: this._moveUp, args: [key] });
  }

  moveDown(key: string): void {
    this.enqueueOp({ fn: this._moveDown, args: [key] });
  }

  moveAbove(subject: string, target: string): void {
    this.enqueueOp({ fn: this._moveAbove, args: [subject, target] });
  }

  moveBelow(subject: string, target: string): void {
    this.enqueueOp({ fn: this._moveBelow, args: [subject, target] });
  }

  swap(subject: string, target: string): void {
    this.enqueueOp({ fn: this._swap, args: [subject, target] });
  }

  getScene(key: string): Scene | undefined {
    return this._lookup.get(key);
  }

  update(delta: number): void {
    this._processQueue();

    // update scenes from top to bottom
    for (let i = this._scenes.length - 1; i >= 0; i--) {
      const scene = this._scenes[i];

      if (scene.state.shouldUpdate()) {
        this._messaging.publish(SceneEvent.BeforeUpdate, scene, delta);

        scene.update?.(delta);

        this._messaging.publish(SceneEvent.AfterUpdate, scene, delta);
      }
    }
  }

  render(): void {
    // render scenes from bottom to top
    for (let i = 0; i < this._scenes.length; i++) {
      const scene = this._scenes[i];

      if (scene.state.shouldRender()) {
        this._messaging.publish(SceneEvent.BeforeRender, scene);

        scene.render?.();

        this._messaging.publish(SceneEvent.AfterRender, scene);
      }
    }
  }

  destroy(): void {
    this._scenes.forEach((scene) => {
      this._shutdown(scene.key);
    });

    this._scenes = [];
    this._lookup.clear();
    this._queue = [];
  }

  enqueueOp(op: OpQueueItem): void {
    this._queue.push(op);
  }

  private _processQueue(): void {
    // process queue
    while (this._queue.length > 0) {
      const op = this._queue.shift();
      op?.fn.apply(this, op.args);
    }
  }

  private _add = (key: string, ctor: Type<Scene>, autostart = false, data: any = {}): void => {
    const scene = new ctor(key, this._engine);
    scene.inject(IMessageBus.KEY, this._messaging);
    scene.inject(ISceneManagerProxy.KEY, new SceneManagerProxy(this, scene));

    this._lookup.set(key, scene);
    this._scenes.push(scene);

    this._messaging.publish(SceneEvent.Added, scene, data);

    scene.state.status = SceneStatus.Init;

    // send event before calling scene.init to let modules inject stuff into the scene
    this._messaging.publish(SceneEvent.Init, scene);

    scene.init?.();

    if (autostart) {
      this._start(key, data);
    }
  };

  private _start = (key: string, data: any = {}): void => {
    const scene = this._lookup.get(key);

    if (scene) {
      if (scene.state.isActive()) {
        return;
      }

      if (scene.state.isPaused()) {
        return this._resume(key, data);
      }

      if (scene.state.isSleeping()) {
        return this._wakeup(key, data);
      }

      scene.state.status = SceneStatus.Loading;
      const promise = scene.load?.() ?? Promise.resolve();

      this._messaging.publish(SceneEvent.Loading, scene, data, promise);

      promise
        .then(() => {
          this._messaging.publish(SceneEvent.Loaded, scene, data);

          this._create(key, data);
        })
        .catch((err) => {
          console.error('Failed to load scene: ', err);
          scene.state.status = SceneStatus.Stopped;

          this._messaging.publish(SceneEvent.LoadFailed, scene, data, err);
        });
    }
  };

  private _create = (key: string, data: any = {}): void => {
    const scene = this._lookup.get(key);

    if (scene && scene.state.isActive()) {
      scene.state.status = SceneStatus.Creating;

      scene.create?.(data);

      this._messaging.publish(SceneEvent.Created, scene, data);

      scene.state.status = SceneStatus.Running;
    }
  };

  private _pause = (key: string): void => {
    const scene = this._lookup.get(key);

    if (scene && scene.state.isActive()) {
      scene.state.status = SceneStatus.Paused;
      scene.pause?.();

      this._messaging.publish(SceneEvent.Paused, scene);
    }
  };

  private _sleep = (key: string): void => {
    const scene = this._lookup.get(key);

    if (scene && scene.state.isActive()) {
      scene.state.status = SceneStatus.Sleeping;
      scene.sleep?.();

      this._messaging.publish(SceneEvent.Sleeping, scene);
    }
  };

  private _resume = (key: string, data: any = {}): void => {
    const scene = this._lookup.get(key);

    if (scene && scene.state.isPaused()) {
      scene.resume?.(data);
      scene.state.status = SceneStatus.Running;

      this._messaging.publish(SceneEvent.Resumed, scene, data);
    }
  };

  private _wakeup = (key: string, data: any = {}): void => {
    const scene = this._lookup.get(key);

    if (scene && scene.state.isSleeping()) {
      scene.wakeup?.(data);
      scene.state.status = SceneStatus.Running;

      this._messaging.publish(SceneEvent.Woken, scene, data);
    }
  };

  private _stop = (key: string): void => {
    const scene = this._lookup.get(key);

    if (scene) {
      scene.state.status = SceneStatus.Stopped;
      scene.stop?.();

      this._messaging.publish(SceneEvent.Stopped, scene);
    }
  };

  private _shutdown = (key: string): void => {
    const scene = this._lookup.get(key);

    if (scene) {
      this._stop(key);

      scene.state.status = SceneStatus.Destroyed;
      scene.destroy?.();

      this._messaging.publish(SceneEvent.Destroyed, scene);
    }
  };

  private _remove = (key: string): void => {
    const scene = this._lookup.get(key);

    if (scene) {
      this._shutdown(key);

      const index = this._scenes.indexOf(scene);

      this._scenes.splice(index, 1);
      this._lookup.delete(key);

      this._messaging.publish(SceneEvent.Removed, scene);
    }
  };

  private _bringToTop = (key: string): void => {
    const scene = this._lookup.get(key);

    if (scene) {
      const index = this._scenes.indexOf(scene);

      if (index !== -1 && index < this._scenes.length) {
        this._scenes.splice(index, 1);
        this._scenes.push(scene);
      }
    }
  };

  private _sendToBack = (key: string): void => {
    const scene = this._lookup.get(key);

    if (scene) {
      const index = this._scenes.indexOf(scene);

      if (index > 0) {
        this._scenes.splice(index, 1);
        this._scenes.unshift(scene);
      }
    }
  };

  private _moveAbove = (subjectKey: string, targetKey: string): void => {
    const targetScene = this._lookup.get(targetKey);
    const subjectScene = this._lookup.get(subjectKey);

    if (targetScene && subjectScene) {
      const targetIndex = this._scenes.indexOf(targetScene);
      const subjectIndex = this._scenes.indexOf(subjectScene);

      if (targetIndex !== -1 && subjectIndex !== -1) {
        this._scenes.splice(subjectIndex, 1);
        this._scenes.splice(targetIndex + 1, 0, subjectScene);
      }
    }
  };

  private _moveBelow = (subjectKey: string, targetKey: string): void => {
    const targetScene = this._lookup.get(targetKey);
    const subjectScene = this._lookup.get(subjectKey);

    if (targetScene && subjectScene) {
      const targetIndex = this._scenes.indexOf(targetScene);
      const subjectIndex = this._scenes.indexOf(subjectScene);

      if (targetIndex !== -1 && subjectIndex !== -1) {
        this._scenes.splice(subjectIndex, 1);
        this._scenes.splice(targetIndex, 0, subjectScene);
      }
    }
  };

  private _moveUp = (key: string): void => {
    const scene = this._lookup.get(key);

    if (scene) {
      const index = this._scenes.indexOf(scene);

      if (index !== -1 && index < this._scenes.length) {
        const targetIndex = index + 1;
        const targetScene = this._scenes[targetIndex];

        this._scenes[index] = targetScene;
        this._scenes[targetIndex] = scene;
      }
    }
  };

  private _moveDown = (key: string): void => {
    const scene = this._lookup.get(key);

    if (scene) {
      const index = this._scenes.indexOf(scene);

      if (index > 0) {
        const targetIndex = index - 1;
        const targetScene = this._scenes[targetIndex];

        this._scenes[index] = targetScene;
        this._scenes[targetIndex] = scene;
      }
    }
  };

  private _swap = (subjectKey: string, targetKey: string): void => {
    const subjectScene = this._lookup.get(subjectKey);
    const targetScene = this._lookup.get(targetKey);

    if (subjectScene && targetScene) {
      const subjectIndex = this._scenes.indexOf(subjectScene);
      const targetIndex = this._scenes.indexOf(targetScene);

      if (subjectIndex !== targetIndex && subjectIndex !== -1 && targetIndex !== -1) {
        this._scenes[subjectIndex] = targetScene;
        this._scenes[targetIndex] = subjectScene;
      }
    }
  };
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ISceneManager {
  export const KEY = Symbol('SceneManager');
}
