export type Type<T = any> = new (...args: any[]) => T;

export type Provider = {
  key: string;
  useValue?: any;
  useClass?: Type<any>;
  useFactory?: (...args: any[]) => any;
};
