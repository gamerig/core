import { IEngine } from '../engine/Engine';

export abstract class System {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  init(engine: IEngine): void {
    // should be implemented by subclasses
  }

  destroy(): void {
    // should be implemented by subclasses
  }
}
