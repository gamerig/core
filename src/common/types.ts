export type Type<T = any> = new (...args: any[]) => T;
export type Provider = {
  key: string | symbol;
  useValue?: any;
  useClass?: Type<any>;
  useFactory?: (...args: any[]) => any;
};

export type OpQueueItem = {
  fn: (...args: any[]) => any;
  args: any[];
};
