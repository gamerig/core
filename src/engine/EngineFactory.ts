import { Engine } from './Engine';
import { EngineSettings } from './EngineSettings';

export class EngineFactory {
  static create(settings?: EngineSettings): Engine {
    const engine = new Engine(settings || {});

    /** Very important to initialize the engine */
    engine.init();

    return engine;
  }
}
