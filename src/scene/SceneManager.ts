import { Engine, Type } from '../engine';
import { MessageBus } from '../messaging/MessageBus';
import { SceneEvent } from '.';
import { Scene } from './Scene';
import { SceneStatus } from './SceneState';

type OpQueueItem = { fn: (...args: any[]) => any; args: any[] };

export class SceneManager {
  private queue: OpQueueItem[] = [];

  private lookup: Map<string, Scene> = new Map();

  private scenes: Scene[] = [];

  private events: MessageBus;

  constructor(readonly engine: Engine) {
    this.events = this.engine.messaging;
  }

  add(name: string, ctor: Type<Scene>, autostart = false, data: any = {}): void {
    this.enqueueOp({ fn: this._add, args: [name, ctor, autostart, data] });
  }

  remove(name: string): void {
    this.enqueueOp({ fn: this._remove, args: [name] });
  }

  start(name: string, data: any = {}): void {
    this.enqueueOp({ fn: this._start, args: [name, data] });
  }

  restart(name: string, data: any = {}): void {
    this.stop(name);
    this.start(name, data);
  }

  pause(name: string): void {
    this.enqueueOp({ fn: this._pause, args: [name] });
  }

  sleep(name: string): void {
    this.enqueueOp({ fn: this._sleep, args: [name] });
  }

  stop(name: string): void {
    this.enqueueOp({ fn: this._stop, args: [name] });
  }

  shutdown(name: string): void {
    this.enqueueOp({ fn: this._shutdown, args: [name] });
  }

  bringToTop(name: string): void {
    this.enqueueOp({ fn: this._bringToTop, args: [name] });
  }

  sendToBack(name: string): void {
    this.enqueueOp({ fn: this._sendToBack, args: [name] });
  }

  moveUp(name: string): void {
    this.enqueueOp({ fn: this._moveUp, args: [name] });
  }

  moveDown(name: string): void {
    this.enqueueOp({ fn: this._moveDown, args: [name] });
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

  getScene(name: string): Scene | undefined {
    return this.lookup.get(name);
  }

  update(delta: number): void {
    this._processQueue();

    // update scenes from top to bottom
    for (let i = this.scenes.length - 1; i >= 0; i--) {
      const scene = this.scenes[i];

      if (scene.state.shouldUpdate()) {
        this.events.publish(SceneEvent.BeforeUpdate, scene, delta);

        scene.update?.(delta);

        this.events.publish(SceneEvent.AfterUpdate, scene, delta);
      }
    }
  }

  render(): void {
    // render scenes from bottom to top
    for (let i = 0; i < this.scenes.length; i++) {
      const scene = this.scenes[i];

      if (scene.state.shouldRender()) {
        this.events.publish(SceneEvent.BeforeRender, scene);

        scene.render?.();

        this.events.publish(SceneEvent.AfterRender, scene);
      }
    }
  }

  destroy(): void {
    this.scenes.forEach((scene) => {
      this._shutdown(scene.name);
    });

    this.scenes = [];
    this.lookup.clear();
    this.queue = [];
  }

  enqueueOp(op: OpQueueItem): void {
    this.queue.push(op);
  }

  private _processQueue(): void {
    while (this.queue.length > 0) {
      const op = this.queue.shift();
      op?.fn.apply(this, op.args);
    }
  }

  private _add = (name: string, ctor: Type<Scene>, autostart = false, data: any = {}): void => {
    const scene = new ctor(name, this.engine, this);

    this.lookup.set(name, scene);
    this.scenes.push(scene);

    this.events.publish(SceneEvent.Added, scene, data);

    scene.state.status = SceneStatus.Init;

    this.events.publish(SceneEvent.Init, scene);

    scene.init?.();

    if (autostart) {
      this._start(name, data);
    }
  };

  private _start = (name: string, data: any = {}): void => {
    const scene = this.lookup.get(name);

    if (scene) {
      if (scene.state.isActive()) {
        return;
      }

      if (scene.state.isPaused()) {
        return this._resume(name, data);
      }

      if (scene.state.isSleeping()) {
        return this._wakeup(name, data);
      }

      scene.state.status = SceneStatus.Loading;
      const promise = scene.load?.() ?? Promise.resolve();

      this.events.publish(SceneEvent.Loading, scene, data, promise);

      promise
        .then(() => {
          this.events.publish(SceneEvent.Loaded, scene, data);

          this._create(name, data);
        })
        .catch((err) => {
          console.error('Failed to load scene: ', err);
          scene.state.status = SceneStatus.Stopped;

          this.events.publish(SceneEvent.LoadFailed, scene, data, err);
        });
    }
  };

  private _create = (name: string, data: any = {}): void => {
    const scene = this.lookup.get(name);

    if (scene && scene.state.isActive()) {
      scene.state.status = SceneStatus.Creating;

      scene.create?.(data);

      this.events.publish(SceneEvent.Created, scene, data);

      scene.state.status = SceneStatus.Running;
    }
  };

  private _pause = (name: string): void => {
    const scene = this.lookup.get(name);

    if (scene && scene.state.isActive()) {
      scene.state.status = SceneStatus.Paused;
      scene.pause?.();

      this.events.publish(SceneEvent.Paused, scene);
    }
  };

  private _sleep = (name: string): void => {
    const scene = this.lookup.get(name);

    if (scene && scene.state.isActive()) {
      scene.state.status = SceneStatus.Sleeping;
      scene.sleep?.();

      this.events.publish(SceneEvent.Sleeping, scene);
    }
  };

  private _resume = (name: string, data: any = {}): void => {
    const scene = this.lookup.get(name);

    if (scene && scene.state.isPaused()) {
      scene.resume?.(data);
      scene.state.status = SceneStatus.Running;

      this.events.publish(SceneEvent.Resumed, scene, data);
    }
  };

  private _wakeup = (name: string, data: any = {}): void => {
    const scene = this.lookup.get(name);

    if (scene && scene.state.isSleeping()) {
      scene.wakeup?.(data);
      scene.state.status = SceneStatus.Running;

      this.events.publish(SceneEvent.Woken, scene, data);
    }
  };

  private _stop = (name: string): void => {
    const scene = this.lookup.get(name);

    if (scene) {
      scene.state.status = SceneStatus.Stopped;
      scene.stop?.();

      this.events.publish(SceneEvent.Stopped, scene);
    }
  };

  private _shutdown = (name: string): void => {
    const scene = this.lookup.get(name);

    if (scene) {
      this._stop(name);

      scene.state.status = SceneStatus.Destroyed;
      scene.destroy?.();

      this.events.publish(SceneEvent.Destroyed, scene);
    }
  };

  private _remove = (name: string): void => {
    const scene = this.lookup.get(name);

    if (scene) {
      this._shutdown(name);

      const index = this.scenes.indexOf(scene);

      this.scenes.splice(index, 1);
      this.lookup.delete(name);

      this.events.publish(SceneEvent.Removed, scene);
    }
  };

  private _bringToTop = (name: string): void => {
    const scene = this.lookup.get(name);

    if (scene) {
      const index = this.scenes.indexOf(scene);

      if (index !== -1 && index < this.scenes.length) {
        this.scenes.splice(index, 1);
        this.scenes.push(scene);
      }
    }
  };

  private _sendToBack = (name: string): void => {
    const scene = this.lookup.get(name);

    if (scene) {
      const index = this.scenes.indexOf(scene);

      if (index > 0) {
        this.scenes.splice(index, 1);
        this.scenes.unshift(scene);
      }
    }
  };

  private _moveAbove = (subjectName: string, targetName: string): void => {
    const targetScene = this.lookup.get(targetName);
    const subjectScene = this.lookup.get(subjectName);

    if (targetScene && subjectScene) {
      const targetIndex = this.scenes.indexOf(targetScene);
      const subjectIndex = this.scenes.indexOf(subjectScene);

      if (targetIndex !== -1 && subjectIndex !== -1) {
        this.scenes.splice(subjectIndex, 1);
        this.scenes.splice(targetIndex + 1, 0, subjectScene);
      }
    }
  };

  private _moveBelow = (subjectName: string, targetName: string): void => {
    const targetScene = this.lookup.get(targetName);
    const subjectScene = this.lookup.get(subjectName);

    if (targetScene && subjectScene) {
      const targetIndex = this.scenes.indexOf(targetScene);
      const subjectIndex = this.scenes.indexOf(subjectScene);

      if (targetIndex !== -1 && subjectIndex !== -1) {
        this.scenes.splice(subjectIndex, 1);
        this.scenes.splice(targetIndex, 0, subjectScene);
      }
    }
  };

  private _moveUp = (name: string): void => {
    const scene = this.lookup.get(name);

    if (scene) {
      const index = this.scenes.indexOf(scene);

      if (index !== -1 && index < this.scenes.length) {
        const targetIndex = index + 1;
        const targetScene = this.scenes[targetIndex];

        this.scenes[index] = targetScene;
        this.scenes[targetIndex] = scene;
      }
    }
  };

  private _moveDown = (name: string): void => {
    const scene = this.lookup.get(name);

    if (scene) {
      const index = this.scenes.indexOf(scene);

      if (index > 0) {
        const targetIndex = index - 1;
        const targetScene = this.scenes[targetIndex];

        this.scenes[index] = targetScene;
        this.scenes[targetIndex] = scene;
      }
    }
  };

  private _swap = (subjectName: string, targetName: string): void => {
    const subjectScene = this.lookup.get(subjectName);
    const targetScene = this.lookup.get(targetName);

    if (subjectScene && targetScene) {
      const subjectIndex = this.scenes.indexOf(subjectScene);
      const targetIndex = this.scenes.indexOf(targetScene);

      if (subjectIndex !== targetIndex && subjectIndex !== -1 && targetIndex !== -1) {
        this.scenes[subjectIndex] = targetScene;
        this.scenes[targetIndex] = subjectScene;
      }
    }
  };
}
