export enum SceneStatus {
  Pending = 0,
  Init,
  Loading,
  Creating,
  Running,
  Paused,
  Sleeping,
  Stopped,
  Destroyed,
}

export class SceneState {
  constructor(
    private readonly _key: string,
    private _status: SceneStatus = SceneStatus.Pending,
    private _visible = false,
  ) {}

  get key(): string {
    return this._key;
  }

  get status(): SceneStatus {
    return this._status;
  }

  set status(status: SceneStatus) {
    this._status = status;
    this._visible = this.isActive() || this.isPaused();
  }

  shouldUpdate(): boolean {
    return this.isActive() && this._status !== SceneStatus.Loading;
  }

  shouldRender(): boolean {
    return this._visible && this.isActive();
  }

  isPaused(): boolean {
    return this._status === SceneStatus.Paused;
  }

  isSleeping(): boolean {
    return this._status === SceneStatus.Sleeping;
  }

  isActive(): boolean {
    return this._status >= SceneStatus.Loading && this._status <= SceneStatus.Running;
  }
}
