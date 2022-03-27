export class EngineEvent {
  static readonly Started = ['event', 'engine', Symbol('started')];
  static readonly BeforeUpdate = ['event', 'engine', Symbol('beforeUpdate')];
  static readonly AfterUpdate = ['event', 'engine', Symbol('afterUpdate')];
  static readonly BeforeRender = ['event', 'engine', Symbol('beforeRender')];
  static readonly AfterRender = ['event', 'engine', Symbol('afterRender')];
}
