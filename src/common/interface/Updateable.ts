export interface Updateable {
  update(delta: number): void;
}

export const isUpdateable = (obj: any): obj is Updateable => {
  return typeof obj.update === 'function';
};
