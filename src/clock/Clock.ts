import { TARGET_FPMS } from '../common/constants';

export class Clock {
  public deltaTime = 1;

  public deltaMS: number;

  public elapsedMS: number;

  public lastTime = -1;

  public speed = 1;

  public started = false;

  private _requestId: number | null = null;

  private _maxElapsedMS = 100;

  private _minElapsedMS = 0;

  private _lastFrame = -1;

  private _tick: (time: number) => any;

  constructor(private readonly callback: (delta: number) => any) {
    this.deltaMS = 1 / TARGET_FPMS;
    this.elapsedMS = 1 / TARGET_FPMS;

    this._tick = (time: number): void => {
      this._requestId = null;

      if (this.started) {
        this.update(time);

        if (this.started && this._requestId === null) {
          this._requestId = requestAnimationFrame(this._tick);
        }
      }
    };
  }

  private _requestIfNeeded(): void {
    if (this._requestId === null) {
      // ensure callbacks get correct delta
      this.lastTime = performance.now();
      this._lastFrame = this.lastTime;
      this._requestId = requestAnimationFrame(this._tick);
    }
  }

  private _cancelIfNeeded(): void {
    if (this._requestId !== null) {
      cancelAnimationFrame(this._requestId);
      this._requestId = null;
    }
  }

  start(): void {
    if (!this.started) {
      this.started = true;
      this._requestIfNeeded();
    }
  }

  stop(): void {
    if (this.started) {
      this.started = false;
      this._cancelIfNeeded();
    }
  }

  update(currentTime = performance.now()): void {
    let elapsedMS;

    if (currentTime > this.lastTime) {
      // Save uncapped elapsedMS for measurement
      elapsedMS = this.elapsedMS = currentTime - this.lastTime;

      // cap the milliseconds elapsed used for deltaTime
      if (elapsedMS > this._maxElapsedMS) {
        elapsedMS = this._maxElapsedMS;
      }

      elapsedMS *= this.speed;

      // If not enough time has passed, exit the function.
      // Get ready for next frame by setting _lastFrame, but based on _minElapsedMS
      // adjustment to ensure a relatively stable interval.
      if (this._minElapsedMS) {
        const delta = (currentTime - this._lastFrame) | 0;

        if (delta < this._minElapsedMS) {
          return;
        }

        this._lastFrame = currentTime - (delta % this._minElapsedMS);
      }

      this.deltaMS = elapsedMS;
      this.deltaTime = this.deltaMS * TARGET_FPMS;

      this.callback(this.deltaTime);
    } else {
      this.deltaTime = this.deltaMS = this.elapsedMS = 0;
    }

    this.lastTime = currentTime;
  }

  get FPS(): number {
    return 1000 / this.elapsedMS;
  }

  get minFPS(): number {
    return 1000 / this._maxElapsedMS;
  }

  set minFPS(fps: number) {
    // Minimum must be below the maxFPS
    const minFPS = Math.min(this.maxFPS, fps);

    // Must be at least 0, but below 1 / settings.TARGET_FPMS
    const minFPMS = Math.min(Math.max(0, minFPS) / 1000, TARGET_FPMS);

    this._maxElapsedMS = 1 / minFPMS;
  }

  get maxFPS(): number {
    if (this._minElapsedMS) {
      return Math.round(1000 / this._minElapsedMS);
    }

    return 0;
  }

  set maxFPS(fps: number) {
    if (fps === 0) {
      this._minElapsedMS = 0;
    } else {
      // Max must be at least the minFPS
      const maxFPS = Math.max(this.minFPS, fps);

      this._minElapsedMS = 1 / (maxFPS / 1000);
    }
  }
}
