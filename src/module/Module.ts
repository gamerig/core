import { IEngine } from '../engine/Engine';

export interface Module {
  init(engine: IEngine): void;
  destroy(): void;
}
