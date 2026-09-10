import type { AppData } from '../types';

export interface AuthUser {
  id: string;
  email: string;
}

const TOKEN_KEY = 'ct-toolkit-jwt';

export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL as string | undefined;
  if (!raw || raw.trim() === '') return '';
  return raw.replace(/\/+$/, '');
}

export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (!token) localStorage.removeItem(TOKEN_KEY);
    else localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export interface AuthResponse {
  user: AuthUser;
  token?: string;
  tokenType?: string;
  expiresAt?: string;
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getStoredToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(apiUrl(path), {
    ...init,
    credentials: 'include',
    headers,
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
  return api<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function registerRequest(email: string, password: string) {
  return api<AuthResponse>('/api/auth/register', {
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
