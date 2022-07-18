import { Engine } from '../engine/Engine';

export interface System {
  init?(engine: Engine): void;
  destroy?(): void;

  update?(delta: number): void;
  render?(): void;
}
