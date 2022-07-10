import { IEngine } from '../engine/Engine';
import { Module } from '../module/Module';
import { Loader } from './loader/Loader';
import { caching } from './middleware/caching';
import { parsing } from './middleware/parsing';
import { IResourceManager, ResourceManager } from './ResourceManager';
import { ScenePlugin } from './ScenePlugin';

export class ResourceModule implements Module {
  private _resources!: IResourceManager;
  private _scenePlugin!: ScenePlugin;

  init(engine: IEngine): void {
    this._resources = new ResourceManager(engine);
    engine.addProvider({ key: IResourceManager.KEY, useValue: this._resources });

    Loader.registerPlugin({ pre: caching(this._resources) });
    Loader.registerPlugin({ use: parsing });

    this._scenePlugin = new ScenePlugin(engine);
  }

  destroy(): void {
    this._scenePlugin.destroy();
    this._resources.destroy();
  }
}
