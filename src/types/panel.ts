import type { Action } from './action';

export interface Panel {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  actions: Action[];
}

export interface AppData {
  version: number;
  panels: Panel[];
}

export const APP_DATA_VERSION = 1;
