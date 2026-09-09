import type { AppData } from '../types';

export interface AuthUser {
  id: string;
  email: string;
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  let payload: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { error: text };
    }
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error: unknown }).error)
        : `Error HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

export function loginRequest(email: string, password: string) {
  return api<{ user: AuthUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function registerRequest(email: string, password: string) {
  return api<{ user: AuthUser }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function logoutRequest() {
  return api<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
}

export function meRequest() {
  return api<{ user: AuthUser }>('/api/auth/me');
}

export function fetchUserData() {
  return api<AppData>('/api/data');
}

export function saveUserData(data: AppData) {
  return api<{ ok: boolean }>('/api/data', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
