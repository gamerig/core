import { Engine } from '../engine/Engine';

export interface Module {
  init?(engine: Engine): void;
  destroy?(): void;
}
