import { LoaderResource } from '../loader/LoaderResource';
import { IResourceManager } from '../ResourceManager';

export const caching = (manager: IResourceManager) => {
  return (resource: LoaderResource, next: (...args: any[]) => void): void => {
    if (manager.has(resource.url)) {
      resource.data = manager.get(resource.url)?.data;
      resource.complete();
    } else {
      resource.onComplete.once((r: LoaderResource) => {
        manager.add(r.url, r);
      });
    }

    next();
  };
};
