import { useMemo, useState } from 'react';
import { ArrowLeft, Copy, Pencil, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Action } from '../types';
import { ActionCard } from './ActionCard';
import { ActionForm } from './ActionForm';
import { ConfirmDialog } from './ConfirmDialog';
import { PanelForm } from './PanelForm';
import type { ActionInput } from '../context/AppContext';

interface PanelViewProps {
  panelId: string;
  onBack: () => void;
}

export function PanelView({ panelId, onBack }: PanelViewProps) {
  const {
    getPanel,
    createAction,
    updateAction,
    duplicateAction,
    deleteAction,
    toggleFavorite,
    renamePanel,
    duplicatePanel,
    deletePanel,
  } = useApp();

  const panel = getPanel(panelId);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<Action | null>(null);
  const [deletingAction, setDeletingAction] = useState<Action | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deletePanelOpen, setDeletePanelOpen] = useState(false);

  const actions = useMemo(() => panel?.actions ?? [], [panel]);

  if (!panel) {
    return (
      <div className="page">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          <ArrowLeft size={16} /> Volver
        </button>
        <p className="empty-state">El panel no existe o fue eliminado.</p>
      </div>
    );
  }

  const handleCreate = (input: ActionInput) => {
    createAction(panel.id, input);
    setCreateOpen(false);
  };

  const handleUpdate = (input: ActionInput) => {
    if (!editingAction) return;
    updateAction(panel.id, editingAction.id, input);
    setEditingAction(null);
  };

  return (
    <div className="page">
      <button type="button" className="btn btn-ghost back-btn" onClick={onBack}>
        <ArrowLeft size={16} /> Volver
      </button>

      <header className="page-header">
        <div>
          <h1>{panel.name}</h1>
          <p className="text-muted">
            {actions.length} {actions.length === 1 ? 'acción' : 'acciones'}
          </p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-ghost" onClick={() => setRenameOpen(true)} aria-label="Renombrar panel">
            <Pencil size={16} />
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              duplicatePanel(panel.id);
            }}
            aria-label="Duplicar panel"
            title="Duplicar panel"
          >
            <Copy size={16} />
          </button>
          <button
            type="button"
            className="btn btn-ghost danger-text"
            onClick={() => setDeletePanelOpen(true)}
            aria-label="Eliminar panel"
          >
            <Trash2 size={16} />
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> Nueva acción
          </button>
        </div>
      </header>

      {actions.length === 0 ? (
        <p className="empty-state">Este panel aún no tiene acciones. Crea la primera.</p>
      ) : (
        <div className="action-grid">
          {actions.map((action) => (
            <ActionCard
              key={action.id}
              action={action}
              onEdit={setEditingAction}
              onDuplicate={(item) => duplicateAction(panel.id, item.id)}
              onDelete={setDeletingAction}
              onToggleFavorite={(item) => toggleFavorite(panel.id, item.id)}
            />
          ))}
        </div>
      )}

      <ActionForm
        open={createOpen}
        title="Nueva acción"
        submitLabel="Crear acción"
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />

      <ActionForm
        open={Boolean(editingAction)}
        title="Editar acción"
        initial={editingAction ?? undefined}
        submitLabel="Guardar"
        onClose={() => setEditingAction(null)}
        onSubmit={handleUpdate}
      />

      <PanelForm
        open={renameOpen}
        title="Renombrar panel"
        initialName={panel.name}
        submitLabel="Guardar"
        onClose={() => setRenameOpen(false)}
        onSubmit={(name) => {
          renamePanel(panel.id, name);
          setRenameOpen(false);
        }}
      />

      <ConfirmDialog
        open={Boolean(deletingAction)}
        title="Eliminar acción"
        message={`¿Eliminar la acción «${deletingAction?.name}»?`}
        confirmLabel="Eliminar"
        danger
        onCancel={() => setDeletingAction(null)}
        onConfirm={() => {
          if (deletingAction) deleteAction(panel.id, deletingAction.id);
          setDeletingAction(null);
        }}
      />

      <ConfirmDialog
        open={deletePanelOpen}
        title="Eliminar panel"
        message={`¿Eliminar el panel «${panel.name}» y todas sus acciones?`}
        confirmLabel="Eliminar"
        danger
        onCancel={() => setDeletePanelOpen(false)}
        onConfirm={() => {
          deletePanel(panel.id);
          setDeletePanelOpen(false);
          onBack();
        }}
      />
    </div>
  );
}
