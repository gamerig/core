import { Engine } from '../engine/Engine';
import { SystemEvent, SystemOptions } from '.';
import { System } from './System';

type SystemRegistration = {
  system: System;
  options: SystemOptions;
};

export class SystemManager {
  sortSystems = true;

  private systems: SystemRegistration[] = [];

  constructor(readonly engine: Engine) {}

  add(system: System, options: SystemOptions): this {
    this.systems.push({ system, options });

    if (system.init) {
      system.init(this.engine);
    }

    this.sortSystems = true;

    this.engine.messaging.publish(SystemEvent.Added, system);

    return this;
  }

  update(delta: number): void {
    this.sortIfNeeded();

    this.systems.forEach(({ system }) => {
      if (system.update) {
        this.engine.messaging.publish(SystemEvent.BeforeUpdate, system, delta);

        system.update(delta);

        this.engine.messaging.publish(SystemEvent.AfterUpdate, system, delta);
      }
    });
  }

  render(): void {
    this.sortIfNeeded();

    this.systems.forEach(({ system }) => {
      if (system.render) {
        this.engine.messaging.publish(SystemEvent.BeforeRender, system);

        system.render();

        this.engine.messaging.publish(SystemEvent.AfterRender, system);
      }
    });
  }

  destroy(): void {
    this.systems.forEach(({ system }) => {
      if (system.destroy) {
        system.destroy();
      }

      this.engine.messaging.publish(SystemEvent.Destroyed, system);
    });

    this.systems = [];
  }

  private sortIfNeeded(): void {
    if (this.sortSystems) {
      this.systems.sort((a, b) => b.options.priority - a.options.priority);
      this.sortSystems = false;
    }
  }
}
