export class LoaderEvent {
  public static readonly Started = ['event', 'loader', Symbol('started')];
  public static readonly Progress = ['event', 'loader', Symbol('progress')];
  public static readonly Loaded = ['event', 'loader', Symbol('loaded')];
  public static readonly Complete = ['event', 'loader', Symbol('complete')];
  public static readonly Failed = ['event', 'loader', Symbol('failed')];
}
