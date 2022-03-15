export class SystemEvent {
  static readonly BeforeUpdate = ['event', 'system', Symbol('BeforeUpdate')];
  static readonly AfterUpdate = ['event', 'system', Symbol('AfterUpdate')];
  static readonly BeforeRender = ['event', 'system', Symbol('BeforeRender')];
  static readonly AfterRender = ['event', 'system', Symbol('AfterRender')];
  static readonly Added = ['event', 'system', Symbol('Added')];
  static readonly Destroyed = ['event', 'system', Symbol('Destroyed')];
}
