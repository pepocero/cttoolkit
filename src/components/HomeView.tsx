import { useMemo, useState } from 'react';
import { Plus, Star } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Action, Panel } from '../types';
import { PanelCard } from './PanelCard';
import { PanelForm } from './PanelForm';
import { ActionCard } from './ActionCard';
import { ActionForm } from './ActionForm';
import { BackupManager } from './BackupManager';
import { ConfirmDialog } from './ConfirmDialog';
import { SearchBar } from './SearchBar';
import { getFavoriteActions, searchAppData } from '../utils/search';
import type { ActionInput } from '../context/AppContext';

interface HomeViewProps {
  onOpenPanel: (panelId: string) => void;
}

export function HomeView({ onOpenPanel }: HomeViewProps) {
  const {
    data,
    createPanel,
    renamePanel,
    duplicatePanel,
    deletePanel,
    updateAction,
    duplicateAction,
    deleteAction,
    toggleFavorite,
  } = useApp();

  const [query, setQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editingPanel, setEditingPanel] = useState<Panel | null>(null);
  const [deletingPanel, setDeletingPanel] = useState<Panel | null>(null);
  const [editingAction, setEditingAction] = useState<{ panelId: string; action: Action } | null>(null);
  const [deletingAction, setDeletingAction] = useState<{ panelId: string; action: Action } | null>(null);

  const favorites = useMemo(() => getFavoriteActions(data), [data]);
  const searchHits = useMemo(() => searchAppData(data, query), [data, query]);

  const handleCreate = (name: string) => {
    const panel = createPanel(name);
    setCreateOpen(false);
    onOpenPanel(panel.id);
  };

  const handleEditActionSubmit = (input: ActionInput) => {
    if (!editingAction) return;
    updateAction(editingAction.panelId, editingAction.action.id, input);
    setEditingAction(null);
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Panel técnico</p>
          <h1>Mis paneles</h1>
          <p className="text-muted">
            Organiza URLs, rutas de red y comandos para soporte y configuración.
          </p>
        </div>
        <button type="button" className="btn btn-primary btn-lg" onClick={() => setCreateOpen(true)}>
          <Plus size={18} /> Nuevo panel
        </button>
      </header>

      <SearchBar value={query} onChange={setQuery} />

      {query.trim() ? (
        <section className="section">
          <h2>Resultados de búsqueda</h2>
          {searchHits.length === 0 ? (
            <p className="empty-state">No se encontraron coincidencias.</p>
          ) : (
            <div className="stack-gap">
              {searchHits.map((hit) =>
                hit.kind === 'panel' ? (
                  <div key={`panel-${hit.panel.id}`} className="search-hit">
                    <div>
                      <p className="search-hit__kind">Panel</p>
                      <h3>{hit.panel.name}</h3>
                      <p className="text-muted">
                        {hit.panel.actions.length} acciones
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => onOpenPanel(hit.panel.id)}
                    >
                      Abrir panel
                    </button>
                  </div>
                ) : (
                  <ActionCard
                    key={`action-${hit.panel.id}-${hit.action!.id}`}
                    action={hit.action!}
                    panelName={hit.panel.name}
                    onEdit={(action) => setEditingAction({ panelId: hit.panel.id, action })}
                    onDuplicate={(action) => duplicateAction(hit.panel.id, action.id)}
                    onDelete={(action) => setDeletingAction({ panelId: hit.panel.id, action })}
                    onToggleFavorite={(action) => toggleFavorite(hit.panel.id, action.id)}
                  />
                ),
              )}
            </div>
          )}
        </section>
      ) : (
        <>
          <section className="section">
            <div className="section-title">
              <Star size={18} />
              <h2>Acciones favoritas</h2>
            </div>
            {favorites.length === 0 ? (
              <p className="empty-state">
                Marca acciones con la estrella para verlas aquí.
              </p>
            ) : (
              <div className="action-grid">
                {favorites.map(({ panel, action }) => (
                  <ActionCard
                    key={`${panel.id}-${action.id}`}
                    action={action}
                    panelName={panel.name}
                    onEdit={(item) => setEditingAction({ panelId: panel.id, action: item })}
                    onDuplicate={(item) => duplicateAction(panel.id, item.id)}
                    onDelete={(item) => setDeletingAction({ panelId: panel.id, action: item })}
                    onToggleFavorite={(item) => toggleFavorite(panel.id, item.id)}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="section">
            <h2>Paneles</h2>
            {data.panels.length === 0 ? (
              <p className="empty-state">Aún no hay paneles. Crea el primero.</p>
            ) : (
              <div className="panel-grid">
                {data.panels.map((panel) => (
                  <PanelCard
                    key={panel.id}
                    panel={panel}
                    onOpen={onOpenPanel}
                    onEdit={setEditingPanel}
                    onDuplicate={(item) => duplicatePanel(item.id)}
                    onDelete={setDeletingPanel}
                  />
                ))}
              </div>
            )}
          </section>

          <BackupManager />
        </>
      )}

      <PanelForm
        open={createOpen}
        title="Nuevo panel"
        submitLabel="Crear panel"
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />

      <PanelForm
        open={Boolean(editingPanel)}
        title="Renombrar panel"
        initialName={editingPanel?.name}
        submitLabel="Guardar"
        onClose={() => setEditingPanel(null)}
        onSubmit={(name) => {
          if (editingPanel) renamePanel(editingPanel.id, name);
          setEditingPanel(null);
        }}
      />

      <ActionForm
        open={Boolean(editingAction)}
        title="Editar acción"
        initial={editingAction?.action}
        submitLabel="Guardar"
        onClose={() => setEditingAction(null)}
        onSubmit={handleEditActionSubmit}
      />

      <ConfirmDialog
        open={Boolean(deletingPanel)}
        title="Eliminar panel"
        message={`¿Eliminar el panel «${deletingPanel?.name}» y todas sus acciones? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
        onCancel={() => setDeletingPanel(null)}
        onConfirm={() => {
          if (deletingPanel) deletePanel(deletingPanel.id);
          setDeletingPanel(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(deletingAction)}
        title="Eliminar acción"
        message={`¿Eliminar la acción «${deletingAction?.action.name}»?`}
        confirmLabel="Eliminar"
        danger
        onCancel={() => setDeletingAction(null)}
        onConfirm={() => {
          if (deletingAction) deleteAction(deletingAction.panelId, deletingAction.action.id);
          setDeletingAction(null);
        }}
      />
    </div>
  );
}
