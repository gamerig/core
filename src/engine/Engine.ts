import { Clock } from '../clock/Clock';
import { MessageBus } from '../messaging/MessageBus';
import { Module, ModuleManager } from '../module';
import { SceneManager, SceneSystem } from '../scene';
import { System, SystemManager, SystemOptions, SystemPriority } from '../system';
import { EngineEvent } from '.';
import { Provider } from './types';

export class Engine {
  messaging: MessageBus;
  scenes: SceneManager;

  private _clock!: Clock;

  private _started = false;

  private static modules: Module[] = [];
  private static systems: { system: System; options?: Partial<SystemOptions> }[] = [];

  private moduleManager: ModuleManager;
  private systemManager: SystemManager;

  private providers: { [name: string]: Provider[] } = {};

  constructor() {
    this._clock = new Clock(this.update);

    this.messaging = new MessageBus();

    this.moduleManager = new ModuleManager(this);
    this.systemManager = new SystemManager(this);
    this.scenes = new SceneManager(this);

    Engine.registerSystem(new SceneSystem(this.scenes), { priority: SystemPriority.LOW });
  }

  static registerModule(module: Module): void {
    Engine.modules.push(module);
  }

  static registerSystem(system: System, options?: Partial<SystemOptions>): void {
    Engine.systems.push({ system, options });
  }

  start = (): void => {
    if (this._started) {
      return;
    }

    Engine.modules.forEach((module) => this.moduleManager.add(module));

    Engine.systems.forEach((system) =>
      this.systemManager.add(system.system, {
        priority: SystemPriority.NORMAL,
        clockRate: 60,
        ...system.options,
      }),
    );

    this._clock.start();

    this._started = true;

    this.messaging.publish(EngineEvent.Started);
  };

  update = (delta: number): void => {
    this.messaging.publish(EngineEvent.BeforeUpdate, this, delta);

    this.systemManager.update(delta);

    this.messaging.publish(EngineEvent.AfterUpdate, this, delta);

    this.messaging.publish(EngineEvent.BeforeRender, this);

    this.systemManager.render();

    this.messaging.publish(EngineEvent.AfterRender, this);
  };

  registerProvider = (provider: Provider): void => {
    if (!this.providers[provider.key]) {
      this.providers[provider.key] = [];
    }

    this.providers[provider.key]?.push(provider);
  };

  resolve = <T = any>(key: string): T => {
    const provider = this.providers[key]?.[0];

    if (!provider) {
      throw new Error(`Provider with name ${String(key)} not registered`);
    }

    return this._getProviderValue(provider);
  };

  resolveAll = <T = any>(key: string): T[] => {
    const providers = this.providers[key];

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

  get started(): boolean {
    return this._started;
  }
}
