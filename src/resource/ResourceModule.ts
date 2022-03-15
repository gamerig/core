import { IEngine } from '../engine/Engine';
import { Module } from '../module/Module';
import { Loader } from './loader/Loader';
import { caching } from './middleware/caching';
import { parsing } from './middleware/parsing';
import { IResourceManager, ResourceManager } from './ResourceManager';
import { SceneInjector } from './SceneInjector';

export class ResourceModule implements Module {
  private _resourceManager!: IResourceManager;
  private _sceneProviders!: SceneInjector;

  init(engine: IEngine): void {
    this._resourceManager = new ResourceManager(engine);
    engine.addProvider({ key: IResourceManager.KEY, useValue: this._resourceManager });

    Loader.registerPlugin({ pre: caching(this._resourceManager) });
    Loader.registerPlugin({ use: parsing });

    this._sceneProviders = new SceneInjector(engine);
  }

  destroy(): void {
    this._sceneProviders.destroy();
    this._resourceManager.destroy();
  }
}
