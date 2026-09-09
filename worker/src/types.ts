export interface Env {
  DATA_BUCKET: R2Bucket;
  ASSETS: Fetcher;
  AUTH_SECRET: string;
  SEED_USER_EMAIL: string;
  SEED_USER_PASSWORD: string;
  ALLOW_REGISTRATION: string;
}

export interface UserAccount {
  id: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailIndex {
  userId: string;
  email: string;
}

export interface SessionPayload {
  sub: string;
  email: string;
  exp: number;
}

export interface ActionRecord {
  id: string;
  name: string;
  type: string;
  value: string;
  description?: string;
  favorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PanelRecord {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  actions: ActionRecord[];
}

export interface AppDataRecord {
  version: number;
  panels: PanelRecord[];
}
