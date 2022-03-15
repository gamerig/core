import { Scene } from './Scene';
import { ISceneManager } from './SceneManager';

export interface ISceneManagerProxy {
  // general scene management
  goTo(key: string, data?: any): void;
  start(key: string, data?: any): void;
  restart(key?: string, data?: any): void;
  pause(key?: string): void;
  sleep(key?: string): void;
  stop(key?: string): void;

  // rendering order operations
  bringToTop(key?: string): void;
  sendToBack(key?: string): void;
  moveAbove(target: string, key?: string): void;
  moveBelow(target: string, key?: string): void;
  swap(target: string, key?: string): void;
  moveUp(key?: string): void;
  moveDown(key?: string): void;

  // specialized operations
  showModal(key: string): void;
}

export class SceneManagerProxy implements ISceneManagerProxy {
  constructor(private readonly _manager: ISceneManager, private readonly _scene: Scene) {}

  goTo(key: string, data?: any): void {
    this._manager.stop(this._scene.key);
    this._manager.start(key, data);
  }

  start(key: string, data?: any): void {
    this._manager.start(key, data);
  }

  pause(key?: string): void {
    this._manager.pause(key ?? this._scene.key);
  }

  sleep(key?: string): void {
    this._manager.sleep(key ?? this._scene.key);
  }

  stop(key?: string): void {
    this._manager.stop(key ?? this._scene.key);
  }

  restart(key?: string, data?: any): void {
    this._manager.restart(key ?? this._scene.key, data);
  }

  bringToTop(key?: string): void {
    this._manager.bringToTop(key ?? this._scene.key);
  }

  sendToBack(key?: string): void {
    this._manager.sendToBack(key ?? this._scene.key);
  }

  moveAbove(target: string, key?: string): void {
    this._manager.moveAbove(target, key ?? this._scene.key);
  }

  moveBelow(target: string, key?: string): void {
    this._manager.moveBelow(target, key ?? this._scene.key);
  }

  swap(target: string, key?: string): void {
    this._manager.swap(target, key ?? this._scene.key);
  }

  moveUp(key?: string): void {
    this._manager.moveUp(key ?? this._scene.key);
  }

  moveDown(key?: string): void {
    this._manager.moveDown(key ?? this._scene.key);
  }

  showModal(key: string): void {
    this._manager.pause(this._scene.key);
    this._manager.start(key);
    this._manager.bringToTop(key);
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ISceneManagerProxy {
  export const KEY = Symbol('SceneManagerProxy');
}
