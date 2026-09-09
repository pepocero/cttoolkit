import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Action, ActionType, AppData, Panel } from '../types';
import { createEmptyPanel, touchPanel } from '../services/storageService';
import {
  exportAppDataToFile,
  mergeAppData,
  parseBackupJson,
  readFileAsText,
  replaceAppData,
  type ImportMode,
} from '../services/backupService';
import { fetchUserData, saveUserData } from '../services/apiClient';
import { createId, nowIso } from '../utils/id';
import type { AuthUser } from '../services/apiClient';
import {
  readLegacyLocalData,
  cacheUserData,
  clearLegacyLocalData,
  markLegacyMigrated,
  wasLegacyMigrated,
} from '../services/storageService';

export interface ActionInput {
  name: string;
  type: ActionType;
  value: string;
  description?: string;
  favorite?: boolean;
}

interface AppContextValue {
  data: AppData;
  syncing: boolean;
  syncError: string | null;
  createPanel: (name: string) => Panel;
  renamePanel: (panelId: string, name: string) => void;
  duplicatePanel: (panelId: string) => Panel | null;
  deletePanel: (panelId: string) => void;
  getPanel: (panelId: string) => Panel | undefined;
  createAction: (panelId: string, input: ActionInput) => Action | null;
  updateAction: (panelId: string, actionId: string, input: ActionInput) => void;
  duplicateAction: (panelId: string, actionId: string) => Action | null;
  deleteAction: (panelId: string, actionId: string) => void;
  toggleFavorite: (panelId: string, actionId: string) => void;
  exportBackup: () => void;
  importBackup: (file: File, mode: ImportMode) => Promise<{ panelsImported: number; actionsImported: number }>;
  replaceAllData: (data: AppData) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const SEED_EMAIL = 'pepocero@gmail.com';

function maybeMigrateLegacy(user: AuthUser, cloud: AppData): AppData {
  if (wasLegacyMigrated(user.id)) return cloud;

  const legacy = readLegacyLocalData();
  if (!legacy || legacy.panels.length === 0) {
    markLegacyMigrated(user.id);
    return cloud;
  }

  const shouldPreferLegacy =
    user.email.toLowerCase() === SEED_EMAIL &&
    legacy.panels.length >= cloud.panels.length;

  markLegacyMigrated(user.id);
  if (shouldPreferLegacy) {
    clearLegacyLocalData();
    return legacy;
  }

  return cloud;
}

export function AppProvider({
  user,
  children,
}: {
  user: AuthUser;
  children: ReactNode;
}) {
  const [data, setData] = useState<AppData>({ version: 1, panels: [] });
  const [ready, setReady] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const skipNextSave = useRef(true);
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cloud = await fetchUserData();
        const migrated = maybeMigrateLegacy(user, cloud);
        if (cancelled) return;
        setData(migrated);
        cacheUserData(user.id, migrated);
        skipNextSave.current = migrated === cloud;
        if (migrated !== cloud) {
          skipNextSave.current = false;
        }
        setReady(true);
      } catch (err) {
        if (!cancelled) {
          setSyncError(err instanceof Error ? err.message : 'No se pudieron cargar los datos');
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!ready) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    cacheUserData(user.id, data);

    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      setSyncing(true);
      setSyncError(null);
      try {
        await saveUserData(data);
      } catch (err) {
        setSyncError(err instanceof Error ? err.message : 'Error al guardar en D1');
      } finally {
        setSyncing(false);
      }
    }, 450);

    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [data, ready, user.id]);

  const createPanel = useCallback((name: string) => {
    const panel = createEmptyPanel(name);
    setData((prev) => ({
      ...prev,
      panels: [panel, ...prev.panels],
    }));
    return panel;
  }, []);

  const renamePanel = useCallback((panelId: string, name: string) => {
    setData((prev) => ({
      ...prev,
      panels: prev.panels.map((panel) =>
        panel.id === panelId
          ? touchPanel({ ...panel, name: name.trim() })
          : panel,
      ),
    }));
  }, []);

  const duplicatePanel = useCallback((panelId: string) => {
    let created: Panel | null = null;
    setData((prev) => {
      const source = prev.panels.find((p) => p.id === panelId);
      if (!source) return prev;
      const stamp = nowIso();
      created = {
        id: createId('panel'),
        name: `${source.name} (copia)`,
        createdAt: stamp,
        updatedAt: stamp,
        actions: source.actions.map((action) => ({
          ...action,
          id: createId('action'),
          createdAt: stamp,
          updatedAt: stamp,
        })),
      };
      return { ...prev, panels: [created, ...prev.panels] };
    });
    return created;
  }, []);

  const deletePanel = useCallback((panelId: string) => {
    setData((prev) => ({
      ...prev,
      panels: prev.panels.filter((panel) => panel.id !== panelId),
    }));
  }, []);

  const getPanel = useCallback(
    (panelId: string) => data.panels.find((panel) => panel.id === panelId),
    [data.panels],
  );

  const createAction = useCallback((panelId: string, input: ActionInput) => {
    const stamp = nowIso();
    const action: Action = {
      id: createId('action'),
      name: input.name.trim(),
      type: input.type,
      value: input.value.trim(),
      description: input.description?.trim() || undefined,
      favorite: Boolean(input.favorite),
      createdAt: stamp,
      updatedAt: stamp,
    };

    let created: Action | null = null;
    setData((prev) => ({
      ...prev,
      panels: prev.panels.map((panel) => {
        if (panel.id !== panelId) return panel;
        created = action;
        return touchPanel({
          ...panel,
          actions: [action, ...panel.actions],
        });
      }),
    }));
    return created;
  }, []);

  const updateAction = useCallback((panelId: string, actionId: string, input: ActionInput) => {
    setData((prev) => ({
      ...prev,
      panels: prev.panels.map((panel) => {
        if (panel.id !== panelId) return panel;
        return touchPanel({
          ...panel,
          actions: panel.actions.map((action) =>
            action.id === actionId
              ? {
                  ...action,
                  name: input.name.trim(),
                  type: input.type,
                  value: input.value.trim(),
                  description: input.description?.trim() || undefined,
                  favorite: Boolean(input.favorite),
                  updatedAt: nowIso(),
                }
              : action,
          ),
        });
      }),
    }));
  }, []);

  const duplicateAction = useCallback((panelId: string, actionId: string) => {
    let created: Action | null = null;
    setData((prev) => {
      const sourcePanel = prev.panels.find((p) => p.id === panelId);
      const source = sourcePanel?.actions.find((a) => a.id === actionId);
      if (!source) return prev;
      const stamp = nowIso();
      created = {
        ...source,
        id: createId('action'),
        name: `${source.name} (copia)`,
        favorite: false,
        createdAt: stamp,
        updatedAt: stamp,
      };
      return {
        ...prev,
        panels: prev.panels.map((panel) => {
          if (panel.id !== panelId || !created) return panel;
          return touchPanel({
            ...panel,
            actions: [created, ...panel.actions],
          });
        }),
      };
    });
    return created;
  }, []);

  const deleteAction = useCallback((panelId: string, actionId: string) => {
    setData((prev) => ({
      ...prev,
      panels: prev.panels.map((panel) => {
        if (panel.id !== panelId) return panel;
        return touchPanel({
          ...panel,
          actions: panel.actions.filter((action) => action.id !== actionId),
        });
      }),
    }));
  }, []);

  const toggleFavorite = useCallback((panelId: string, actionId: string) => {
    setData((prev) => ({
      ...prev,
      panels: prev.panels.map((panel) => {
        if (panel.id !== panelId) return panel;
        return touchPanel({
          ...panel,
          actions: panel.actions.map((action) =>
            action.id === actionId
              ? { ...action, favorite: !action.favorite, updatedAt: nowIso() }
              : action,
          ),
        });
      }),
    }));
  }, []);

  const exportBackup = useCallback(() => {
    exportAppDataToFile(data, 'tech-toolkit-backup.json');
  }, [data]);

  const importBackup = useCallback(async (file: File, mode: ImportMode) => {
    const raw = await readFileAsText(file);
    const incoming = parseBackupJson(raw);
    const result = mode === 'replace' ? replaceAppData(incoming) : mergeAppData(data, incoming);
    setData(result.data);
    return {
      panelsImported: result.panelsImported,
      actionsImported: result.actionsImported,
    };
  }, [data]);

  const replaceAllData = useCallback((next: AppData) => {
    setData(next);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      data,
      syncing,
      syncError,
      createPanel,
      renamePanel,
      duplicatePanel,
      deletePanel,
      getPanel,
      createAction,
      updateAction,
      duplicateAction,
      deleteAction,
      toggleFavorite,
      exportBackup,
      importBackup,
      replaceAllData,
    }),
    [
      data,
      syncing,
      syncError,
      createPanel,
      renamePanel,
      duplicatePanel,
      deletePanel,
      getPanel,
      createAction,
      updateAction,
      duplicateAction,
      deleteAction,
      toggleFavorite,
      exportBackup,
      importBackup,
      replaceAllData,
    ],
  );

  if (!ready) {
    return (
      <div className="boot-screen">
        <p>Cargando tus paneles desde D1…</p>
      </div>
    );
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp debe usarse dentro de AppProvider');
  }
  return ctx;
}
