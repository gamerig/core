import { Engine } from '../engine/Engine';
import { ModuleEvent } from '.';
import { Module } from './Module';

export class ModuleManager {
  private _modules: Module[] = [];

  constructor(readonly engine: Engine) {}

  add(module: Module): void {
    this._modules.push(module);

    if (module.init) {
      module.init(this.engine);
    }

    this.engine.messaging.publish(ModuleEvent.Added, module);
  }
}
