import { isRenderable } from '../common/interface/Renderable';
import { isUpdateable } from '../common/interface/Updateable';
import { IEngine } from '../engine/Engine';
import { IMessageBus } from '../messaging/MessageBus';
import { System } from './System';
import { SystemEvent } from './SystemEvent';

type SystemRegistration = {
  system: System;
  priority: number;
};

export class SystemManager {
  private _needSorting = true;
  private _systems: SystemRegistration[] = [];

  private _messaging: IMessageBus;

  constructor(private readonly engine: IEngine) {
    this._messaging = this.engine.messaging;
  }

  addSystem(system: System, priority: number): this {
    this._systems.push({ system, priority });
    system.init(this.engine);

    this._needSorting = true;

    this._messaging.publish(SystemEvent.Added, system);

    return this;
  }

  update(delta: number): void {
    this.sortIfNeeded();

    this._systems.forEach(({ system }) => {
      if (isUpdateable(system)) {
        this._messaging.publish(SystemEvent.BeforeUpdate, system, delta);

        system.update(delta);

        this._messaging.publish(SystemEvent.AfterUpdate, system, delta);
      }
    });
  }

  render(): void {
    this.sortIfNeeded();

    this._systems.forEach(({ system }) => {
      if (isRenderable(system)) {
        this._messaging.publish(SystemEvent.BeforeRender, system);

        system.render();

        this._messaging.publish(SystemEvent.AfterRender, system);
      }
    });
  }

  destroy(): void {
    this._systems.forEach(({ system }) => {
      system.destroy();

      this._messaging.publish(SystemEvent.Destroyed, system);
    });

    this._systems = [];
  }

  private sortIfNeeded(): void {
    if (this._needSorting) {
      this._systems.sort((a, b) => b.priority - a.priority);
      this._needSorting = false;
    }
  }
}
