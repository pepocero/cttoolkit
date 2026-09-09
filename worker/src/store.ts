import type { AppDataRecord, Env, UserAccount } from './types';

const SESSION_COOKIE = 'ct_toolkit_jwt';
const SESSION_DAYS = 14;

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  password_salt: string;
  created_at: string;
  updated_at: string;
}

interface DataRow {
  user_id: string;
  version: number;
  panels_json: string;
  updated_at: string;
}

function rowToAccount(row: UserRow): UserAccount {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    passwordSalt: row.password_salt,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findUserIdByEmail(env: Env, email: string): Promise<string | null> {
  const row = await env.DB.prepare('SELECT id FROM users WHERE email = ?')
    .bind(email)
    .first<{ id: string }>();
  return row?.id ?? null;
}

export async function getAccount(env: Env, userId: string): Promise<UserAccount | null> {
  const row = await env.DB.prepare(
    'SELECT id, email, password_hash, password_salt, created_at, updated_at FROM users WHERE id = ?',
  )
    .bind(userId)
    .first<UserRow>();
  return row ? rowToAccount(row) : null;
}

export async function getAccountByEmail(env: Env, email: string): Promise<UserAccount | null> {
  const row = await env.DB.prepare(
    'SELECT id, email, password_hash, password_salt, created_at, updated_at FROM users WHERE email = ?',
  )
    .bind(email)
    .first<UserRow>();
  return row ? rowToAccount(row) : null;
}

export async function updateAccountPassword(
  env: Env,
  userId: string,
  passwordHash: string,
  passwordSalt: string,
): Promise<void> {
  const updatedAt = new Date().toISOString();
  await env.DB.prepare(
    'UPDATE users SET password_hash = ?, password_salt = ?, updated_at = ? WHERE id = ?',
  )
    .bind(passwordHash, passwordSalt, updatedAt, userId)
    .run();
}

export async function getUserData(env: Env, userId: string): Promise<AppDataRecord | null> {
  const row = await env.DB.prepare(
    'SELECT user_id, version, panels_json, updated_at FROM user_data WHERE user_id = ?',
  )
    .bind(userId)
    .first<DataRow>();

  if (!row) return null;

  try {
    const panels = JSON.parse(row.panels_json) as AppDataRecord['panels'];
    return {
      version: row.version,
      panels: Array.isArray(panels) ? panels : [],
    };
  } catch {
    return { version: 1, panels: [] };
  }
}

export async function saveUserData(env: Env, userId: string, data: AppDataRecord): Promise<void> {
  const updatedAt = new Date().toISOString();
  const panelsJson = JSON.stringify(data.panels);
  const version = data.version ?? 1;

  await env.DB.prepare(
    `INSERT INTO user_data (user_id, version, panels_json, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       version = excluded.version,
       panels_json = excluded.panels_json,
       updated_at = excluded.updated_at`,
  )
    .bind(userId, version, panelsJson, updatedAt)
    .run();
}

export async function createUser(
  env: Env,
  account: UserAccount,
  data: AppDataRecord,
): Promise<void> {
  const existing = await findUserIdByEmail(env, account.email);
  if (existing) {
    throw new Error('EMAIL_TAKEN');
  }

  const panelsJson = JSON.stringify(data.panels);
  const version = data.version ?? 1;

  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO users (id, email, password_hash, password_salt, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).bind(
      account.id,
      account.email,
      account.passwordHash,
      account.passwordSalt,
      account.createdAt,
      account.updatedAt,
    ),
    env.DB.prepare(
      `INSERT INTO user_data (user_id, version, panels_json, updated_at)
       VALUES (?, ?, ?, ?)`,
    ).bind(account.id, version, panelsJson, account.updatedAt),
  ]);
}

export function emptyAppData(): AppDataRecord {
  return { version: 1, panels: [] };
}

export function isValidAppData(value: unknown): value is AppDataRecord {
  if (!value || typeof value !== 'object') return false;
  const data = value as Record<string, unknown>;
  if (!Array.isArray(data.panels)) return false;
  return data.panels.every((panel) => {
    if (!panel || typeof panel !== 'object') return false;
    const p = panel as Record<string, unknown>;
    return (
      typeof p.id === 'string' &&
      typeof p.name === 'string' &&
      Array.isArray(p.actions)
    );
  });
}

export function sessionCookie(token: string, requestUrl: string): string {
  const secure = new URL(requestUrl).protocol === 'https:';
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function clearSessionCookie(requestUrl: string): string {
  const secure = new URL(requestUrl).protocol === 'https:';
  const parts = [
    `${SESSION_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function readSessionToken(request: Request): string | null {
  const cookie = request.headers.get('Cookie') ?? '';
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  if (match?.[1]) return decodeURIComponent(match[1]);

  // Compatibilidad con cookie antigua
  const legacy = cookie.match(/(?:^|;\s*)ct_toolkit_session=([^;]+)/);
  if (legacy?.[1]) return decodeURIComponent(legacy[1]);

  const auth = request.headers.get('Authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7).trim();
  return null;
}

export { SESSION_DAYS };
