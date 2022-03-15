import { Type } from '../common/types';
import { IEngine } from '../engine/Engine';
import { IMessageBus } from '../messaging/MessageBus';
import { Module } from './Module';
import { ModuleEvent } from './ModuleEvent';

export class ModuleManager {
  private _modules: Module[] = [];

  private _messaging: IMessageBus;

  constructor(private readonly _engine: IEngine) {
    this._messaging = this._engine.messaging;
  }

  registerModules(modules: (Type<Module> | Module)[]): void {
    modules.forEach((module) => {
      if (typeof module === 'object') {
        module.init(this._engine);
        this._modules.push(module);

        this._messaging.publish(ModuleEvent.Added, module);
      }

      if (typeof module === 'function') {
        const instance = new module();
        instance.init(this._engine);
        this._modules.push(instance);

        this._messaging.publish(ModuleEvent.Added, instance);
      }
    });
  }
}
