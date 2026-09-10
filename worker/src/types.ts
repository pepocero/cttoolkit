export interface Env {
  DB: D1Database;
  AUTH_SECRET: string;
  SEED_USER_EMAIL: string;
  SEED_USER_PASSWORD: string;
  ALLOW_REGISTRATION: string;
  /** Orígenes permitidos separados por coma (Pages + local). */
  CORS_ORIGINS: string;
}

export interface UserAccount {
  id: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
  updatedAt: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  iat: number;
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
