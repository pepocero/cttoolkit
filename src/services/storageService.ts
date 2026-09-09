import type { AppData, Panel } from '../types';
import { APP_DATA_VERSION } from '../types';
import { nowIso, createId } from '../utils/id';

const LEGACY_STORAGE_KEY = 'ct-toolkit-data';
const LEGACY_INITIALIZED_KEY = 'ct-toolkit-initialized';

function isPanel(value: unknown): value is Panel {
  if (!value || typeof value !== 'object') return false;
  const panel = value as Record<string, unknown>;
  return (
    typeof panel.id === 'string' &&
    typeof panel.name === 'string' &&
    typeof panel.createdAt === 'string' &&
    typeof panel.updatedAt === 'string' &&
    Array.isArray(panel.actions)
  );
}

export function isValidAppData(value: unknown): value is AppData {
  if (!value || typeof value !== 'object') return false;
  const data = value as Record<string, unknown>;
  if (!Array.isArray(data.panels)) return false;
  return data.panels.every(isPanel);
}

export function readLegacyLocalData(): AppData | null {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isValidAppData(parsed)) return null;
    return {
      version: typeof parsed.version === 'number' ? parsed.version : APP_DATA_VERSION,
      panels: parsed.panels,
    };
  } catch {
    return null;
  }
}

export function clearLegacyLocalData(): void {
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  localStorage.removeItem(LEGACY_INITIALIZED_KEY);
}

export function cacheUserData(userId: string, data: AppData): void {
  localStorage.setItem(
    `ct-toolkit-cache:${userId}`,
    JSON.stringify({
      version: data.version ?? APP_DATA_VERSION,
      panels: data.panels,
    }),
  );
}

export function wasLegacyMigrated(userId: string): boolean {
  return localStorage.getItem(`ct-toolkit-migrated:${userId}`) === '1';
}

export function markLegacyMigrated(userId: string): void {
  localStorage.setItem(`ct-toolkit-migrated:${userId}`, '1');
}

export function touchPanel(panel: Panel): Panel {
  return { ...panel, updatedAt: nowIso() };
}

export function createEmptyPanel(name: string): Panel {
  const stamp = nowIso();
  return {
    id: createId('panel'),
    name: name.trim(),
    createdAt: stamp,
    updatedAt: stamp,
    actions: [],
  };
}
