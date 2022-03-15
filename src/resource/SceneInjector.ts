import { IEngine } from '../engine/Engine';
import { EventListener, IMessageBus } from '../messaging/MessageBus';
import { Scene } from '../scene/Scene';
import { SceneEvent } from '../scene/SceneEvent';
import { ILoader, Loader } from './loader/Loader';
import { IResourceManager } from './ResourceManager';

export class SceneInjector {
  private _events: IMessageBus;
  private _sceneListeners: EventListener[] = [];

  constructor(private readonly _engine: IEngine) {
    this._events = this._engine.messaging;
    const resourceManager = this._engine.resolve<IResourceManager>(IResourceManager.KEY);

    this._sceneListeners.push(
      this._events.subscribe(SceneEvent.Init, (scene: Scene): void => {
        const loader = new Loader(this._engine, {
          baseUrl: '',
          concurrency: 10,
        });
        /**
         * In each initialized scene, inject a new loader instance and the global resource manager
         */
        scene.inject(ILoader.KEY, loader);
        scene.inject(IResourceManager.KEY, resourceManager);
      }),
    );

    this._sceneListeners.push(
      this._events.subscribe(SceneEvent.Loading, (scene: Scene): void => {
        scene.loader.start();
      }),
    );

    this._sceneListeners.push(
      this._events.subscribe(SceneEvent.Destroyed, (scene: Scene): void => {
        scene.loader.destroy();
      }),
    );

    this._sceneListeners.push(
      this._events.subscribe(SceneEvent.Stopped, (scene: Scene): void => {
        scene.loader.reset();
      }),
    );
  }

  destroy(): void {
    this._sceneListeners.forEach((listener) => listener.off());
    this._sceneListeners = [];
  }
}
