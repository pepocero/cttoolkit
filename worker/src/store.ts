import type { AppDataRecord, EmailIndex, Env, UserAccount } from './types';

const SESSION_COOKIE = 'ct_toolkit_session';
const SESSION_DAYS = 14;

export function accountKey(userId: string): string {
  return `users/${userId}/account.json`;
}

export function dataKey(userId: string): string {
  return `users/${userId}/data.json`;
}

export function emailIndexKey(email: string): string {
  return `email-index/${email}`;
}

export async function getJson<T>(bucket: R2Bucket, key: string): Promise<T | null> {
  const object = await bucket.get(key);
  if (!object) return null;
  return (await object.json()) as T;
}

export async function putJson(bucket: R2Bucket, key: string, value: unknown): Promise<void> {
  await bucket.put(key, JSON.stringify(value, null, 2), {
    httpMetadata: { contentType: 'application/json; charset=utf-8' },
  });
}

export async function findUserIdByEmail(env: Env, email: string): Promise<string | null> {
  const index = await getJson<EmailIndex>(env.DATA_BUCKET, emailIndexKey(email));
  return index?.userId ?? null;
}

export async function getAccount(env: Env, userId: string): Promise<UserAccount | null> {
  return getJson<UserAccount>(env.DATA_BUCKET, accountKey(userId));
}

export async function getUserData(env: Env, userId: string): Promise<AppDataRecord | null> {
  return getJson<AppDataRecord>(env.DATA_BUCKET, dataKey(userId));
}

export async function saveUserData(env: Env, userId: string, data: AppDataRecord): Promise<void> {
  await putJson(env.DATA_BUCKET, dataKey(userId), data);
}

export async function createUser(
  env: Env,
  account: UserAccount,
  data: AppDataRecord,
): Promise<void> {
  const email = account.email;
  const existing = await findUserIdByEmail(env, email);
  if (existing) {
    throw new Error('EMAIL_TAKEN');
  }

  await putJson(env.DATA_BUCKET, emailIndexKey(email), {
    userId: account.id,
    email,
  } satisfies EmailIndex);
  await putJson(env.DATA_BUCKET, accountKey(account.id), account);
  await putJson(env.DATA_BUCKET, dataKey(account.id), data);
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
    `${SESSION_COOKIE}=${token}`,
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

  const auth = request.headers.get('Authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7).trim();
  return null;
}

export { SESSION_DAYS };
