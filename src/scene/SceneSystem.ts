import { System } from '../system';
import { SceneManager } from './SceneManager';

export class SceneSystem implements System {
  constructor(readonly scenes: SceneManager) {}

  update(delta: number): void {
    this.scenes.update(delta);
  }

  render(): void {
    this.scenes.render();
  }
}
