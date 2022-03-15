export interface Renderable {
  render(): void;
}

export const isRenderable = (obj: any): obj is Renderable => {
  return typeof obj.render === 'function';
};
