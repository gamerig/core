import { Type } from '../common/types';
import { Module } from '../module/Module';
import { Scene } from '../scene/Scene';

export interface EngineSettings {
  modules?: (Type<Module> | Module)[];
  scenes?: { key: string; scene: Type<Scene> }[];

  [key: string | symbol]: any;
}
