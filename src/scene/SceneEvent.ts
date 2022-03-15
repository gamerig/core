export class SceneEvent {
  static readonly Added = ['event', 'scene', Symbol('added')];
  static readonly Removed = ['event', 'scene', Symbol('removed')];

  static readonly BeforeUpdate = ['event', 'scene', Symbol('beforeUpdate')];
  static readonly AfterUpdate = ['event', 'scene', Symbol('afterUpdate')];

  static readonly BeforeRender = ['event', 'scene', Symbol('beforeRender')];
  static readonly AfterRender = ['event', 'scene', Symbol('afterRender')];

  static readonly Init = ['event', 'scene', Symbol('init')];

  static readonly Loading = ['event', 'scene', Symbol('loading')];
  static readonly Loaded = ['event', 'scene', Symbol('loaded')];
  static readonly LoadFailed = ['event', 'scene', Symbol('loadFailed')];

  static readonly Created = ['event', 'scene', Symbol('created')];

  static readonly Paused = ['event', 'scene', Symbol('paused')];
  static readonly Resumed = ['event', 'scene', Symbol('resumed')];

  static readonly Sleeping = ['event', 'scene', Symbol('sleeping')];
  static readonly Woken = ['event', 'scene', Symbol('woken')];

  static readonly Stopped = ['event', 'scene', Symbol('stopped')];

  static readonly Destroyed = ['event', 'scene', Symbol('destroyed')];
}
