import type { AppData, Panel, Action } from '../types';
import { APP_DATA_VERSION } from '../types';
import { isValidAppData } from './storageService';
import { createId, nowIso } from '../utils/id';
import { sanitizeFilename } from '../utils/filename';

export type ImportMode = 'replace' | 'merge';

export interface ImportResult {
  data: AppData;
  panelsImported: number;
  actionsImported: number;
}

function cloneAction(action: Action, forceNewId = false): Action {
  const stamp = nowIso();
  return {
    ...action,
    id: forceNewId ? createId('action') : action.id,
    createdAt: action.createdAt || stamp,
    updatedAt: stamp,
  };
}

function clonePanel(panel: Panel, forceNewIds = false): Panel {
  const stamp = nowIso();
  return {
    ...panel,
    id: forceNewIds ? createId('panel') : panel.id,
    createdAt: panel.createdAt || stamp,
    updatedAt: stamp,
    actions: panel.actions.map((action) => cloneAction(action, forceNewIds)),
  };
}

export function parseBackupJson(raw: string): AppData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('El archivo no contiene JSON válido.');
  }

  if (!isValidAppData(parsed)) {
    throw new Error('La estructura del JSON no coincide con CT Toolkit.');
  }

  return {
    version: typeof parsed.version === 'number' ? parsed.version : APP_DATA_VERSION,
    panels: parsed.panels,
  };
}

export function mergeAppData(current: AppData, incoming: AppData): ImportResult {
  const panels = current.panels.map((panel) => ({
    ...panel,
    actions: [...panel.actions],
  }));

  let panelsImported = 0;
  let actionsImported = 0;

  for (const incomingPanel of incoming.panels) {
    const existingIndex = panels.findIndex((p) => p.id === incomingPanel.id);

    if (existingIndex === -1) {
      panels.push(clonePanel(incomingPanel, false));
      panelsImported += 1;
      actionsImported += incomingPanel.actions.length;
      continue;
    }

    const existing = panels[existingIndex];
    const mergedActions = [...existing.actions];

    for (const action of incomingPanel.actions) {
      const actionIndex = mergedActions.findIndex((a) => a.id === action.id);
      if (actionIndex === -1) {
        mergedActions.push(cloneAction(action, false));
        actionsImported += 1;
      } else {
        mergedActions[actionIndex] = {
          ...cloneAction(action, false),
          id: action.id,
        };
        actionsImported += 1;
      }
    }

    panels[existingIndex] = {
      ...existing,
      name: incomingPanel.name || existing.name,
      updatedAt: nowIso(),
      actions: mergedActions,
    };
    panelsImported += 1;
  }

  return {
    data: {
      version: APP_DATA_VERSION,
      panels,
    },
    panelsImported,
    actionsImported,
  };
}

export function replaceAppData(incoming: AppData): ImportResult {
  const data: AppData = {
    version: APP_DATA_VERSION,
    panels: incoming.panels.map((panel) => clonePanel(panel, false)),
  };

  return {
    data,
    panelsImported: data.panels.length,
    actionsImported: data.panels.reduce((sum, p) => sum + p.actions.length, 0),
  };
}

export function exportAppDataToFile(data: AppData, filename = 'tech-toolkit-backup.json'): void {
  const payload = JSON.stringify(
    {
      version: data.version ?? APP_DATA_VERSION,
      exportedAt: nowIso(),
      panels: data.panels,
    },
    null,
    2,
  );

  const blob = new Blob([payload], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = sanitizeFilename(filename.replace(/\.json$/i, ''), 'json');
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsText(file);
  });
}
