export class ResourceEvent {
  public static readonly Added = ['event', 'resource', Symbol('added')];
  public static readonly Removed = ['event', 'resource', Symbol('removed')];
  public static readonly Cleared = ['event', 'resource', Symbol('clear')];
}
