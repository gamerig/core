import { Clock } from '../clock/Clock';
import { OpQueueItem, Provider } from '../common/types';
import { IMessageBus, MessageBus } from '../messaging/MessageBus';
import { ModuleManager } from '../module/ModuleManager';
import { ResourceModule } from '../resource/ResourceModule';
import { ISceneManager } from '../scene/SceneManager';
import { SceneSystem } from '../scene/SceneSystem';
import { System } from '../system/System';
import { SystemManager } from '../system/SystemManager';
import { EngineEvent } from './EngineEvent';
import { EngineSettings } from './EngineSettings';

export interface IEngine {
  addSystem(system: System, priority?: number): void;

  addProvider(provider: Provider): void;
  resolve<T = any>(key: string | symbol): T;
  resolveAll<T = any>(key: string | symbol): T[];

  start(scene?: string | string[]): void;

  started: boolean;
  settings: EngineSettings;
  messaging: IMessageBus;
}

export class Engine implements IEngine {
  /** Does the engine has been started */
  private _started = false;

  /** Flag marking engine is currently handling system updates */
  private _isProcessing = false;

  /** Provide internal engine heartbeat */
  private _clock!: Clock;

  /** Queue of engine commands to process at the beginning of each tick */
  private _opQueue: OpQueueItem[] = [];

  private _messaging: IMessageBus;

  /** Manage loaded modules */
  private _modules: ModuleManager;

  /** Store all systems in the order of priority */
  private _systems: SystemManager;

  /** Primitive injection container where modules/systems can register services they provide */
  private _container: Map<string | symbol, Provider[]> = new Map();

  /**
   * Engine initializations, required systems registration and module loading
   * @param _settings
   */
  constructor(private readonly _settings: EngineSettings) {
    this._clock = new Clock(this.update);

    this._messaging = new MessageBus();
    this.addProvider({ key: IMessageBus.KEY, useValue: this._messaging });

    this._systems = new SystemManager(this);

    const sceneSys = new SceneSystem();
    this._systems.addSystem(sceneSys, -100);

    this.addProvider({ key: ISceneManager.KEY, useValue: sceneSys.manager });

    this._modules = new ModuleManager(this);
  }

  init = (): void => {
    /**
     * Modules are big chunks of functionality brought into the engine externally
     * They can install other systems into the engine when initialized, hook into lifecycle events
     * or do further engine configuration
     */
    const modules = this.settings.modules || [];
    modules.unshift(ResourceModule);
    this._modules.registerModules(modules);

    /**
     * Add list of scenes to the manager
     */
    const sceneManager = this.resolve<ISceneManager>(ISceneManager.KEY);
    (this.settings.scenes || []).forEach(({ key, scene }) => sceneManager.add(key, scene));
  };

  /**
   * Start engine if not already started
   * Boot the starting scene and start the clock ticking
   *
   * @param scene
   * @returns
   */
  start = (scene?: string | string[]): void => {
    if (this._started) {
      return;
    }

    const sceneManager = this.resolve<ISceneManager>(ISceneManager.KEY);
    const scenes = scene ? (Array.isArray(scene) ? scene : [scene]) : [];

    scenes.forEach((scene) => sceneManager.start(scene));

    this._clock.start();

    this._started = true;

    this._messaging.publish(EngineEvent.Started);
  };

  /**
   * Engine step function
   * @param delta
   */
  update = (delta: number): void => {
    this._processQueue();

    this._isProcessing = true;

    this.messaging.publish(EngineEvent.BeforeUpdate, this, delta);

    this._systems.update(delta);

    this.messaging.publish(EngineEvent.AfterUpdate, this, delta);

    this.messaging.publish(EngineEvent.BeforeRender, this);

    this._systems.render();

    this.messaging.publish(EngineEvent.AfterRender, this);

    this._isProcessing = false;
  };

  /**
   * Proxy method to system manager
   * Queue operations if in the middle of an update step
   * @param system
   * @param priority
   */
  addSystem = (system: System, priority = 0): void => {
    if (this._isProcessing) {
      this._opQueue.push({
        fn: this.addSystem,
        args: [system, priority],
      });

      return;
    }

    this._systems.addSystem(system, priority);
  };

  /**
   * Register a service in the container by a key
   */
  addProvider = (provider: Provider): void => {
    if (!this._container.has(provider.key)) {
      this._container.set(provider.key, []);
    }

    this._container.get(provider.key)?.push(provider);
  };

  /**
   * Return a registered provider by key. If there are multiple providers, return the first one
   * @param key
   * @returns
   */
  resolve = <T = any>(key: string | symbol): T => {
    const provider = this._container.get(key)?.[0];

    if (!provider) {
      throw new Error(`Provider with name ${String(key)} not registered`);
    }

    return this._getProviderValue(provider);
  };

  /**
   * Return the entire list of providers registered for a key
   * @param key
   * @returns
   */
  resolveAll = <T = any>(key: string | symbol): T[] => {
    const providers = this._container.get(key);

    if (!providers) {
      throw new Error(`Provider(s) with name ${String(key)} not registered`);
    }

    return providers.map(this._getProviderValue);
  };

  private _getProviderValue = <T = any>(provider: Provider): T => {
    if (provider.useClass) {
      return new provider.useClass(this);
    }

    if (provider.useFactory) {
      return provider.useFactory(this);
    }

    return provider.useValue;
  };

  /**
   * Started flag getter
   */
  get started(): boolean {
    return this._started;
  }

  get settings(): EngineSettings {
    return this._settings;
  }

  get messaging(): IMessageBus {
    return this.resolve<IMessageBus>(IMessageBus.KEY);
  }

  /**
   * Emtpy the op queue
   */
  private _processQueue(): void {
    while (this._opQueue.length > 0) {
      const op = this._opQueue.shift();
      op?.fn(...op.args);
    }
  }
}
