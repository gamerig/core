import { Renderable } from '../common/interface/Renderable';
import { Updateable } from '../common/interface/Updateable';
import { IEngine } from '../engine/Engine';
import { System } from '../system/System';
import { ISceneManager, SceneManager } from './SceneManager';

export class SceneSystem extends System implements Updateable, Renderable {
  private _scenes!: SceneManager;

  init(engine: IEngine): void {
    this._scenes = new SceneManager(engine);
  }

  update(delta: number): void {
    this._scenes.update(delta);
  }

  render(): void {
    this._scenes.render();
  }

  get manager(): ISceneManager {
    return this._scenes;
  }
}
