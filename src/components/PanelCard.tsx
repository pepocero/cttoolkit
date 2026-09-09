import {
  Building2,
  Copy,
  FolderOpen,
  Pencil,
  Trash2,
} from 'lucide-react';
import type { Panel } from '../types';
import { formatDate } from '../utils/id';
import { DropdownMenu } from './DropdownMenu';

interface PanelCardProps {
  panel: Panel;
  onOpen: (panelId: string) => void;
  onEdit: (panel: Panel) => void;
  onDuplicate: (panel: Panel) => void;
  onDelete: (panel: Panel) => void;
}

export function PanelCard({ panel, onOpen, onEdit, onDuplicate, onDelete }: PanelCardProps) {
  const count = panel.actions.length;

  return (
    <article className="panel-card">
      <div className="panel-card__top">
        <div className="panel-card__icon">
          <Building2 size={22} />
        </div>
        <div className="panel-card__menu">
          <DropdownMenu
            items={[
              {
                id: 'rename',
                label: 'Renombrar',
                icon: <Pencil size={14} />,
                onSelect: () => onEdit(panel),
              },
              {
                id: 'duplicate',
                label: 'Duplicar',
                icon: <Copy size={14} />,
                onSelect: () => onDuplicate(panel),
              },
              {
                id: 'delete',
                label: 'Eliminar',
                icon: <Trash2 size={14} />,
                danger: true,
                onSelect: () => onDelete(panel),
              },
            ]}
          />
        </div>
      </div>

      <h3>{panel.name}</h3>
      <p className="text-muted">
        {count} {count === 1 ? 'acción' : 'acciones'}
      </p>
      <p className="panel-card__meta">Actualizado {formatDate(panel.updatedAt)}</p>

      <div className="panel-card__actions">
        <button type="button" className="btn btn-primary" onClick={() => onOpen(panel.id)}>
          <FolderOpen size={16} /> Abrir panel
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => onEdit(panel)} aria-label="Editar nombre">
          <Pencil size={16} />
        </button>
        <button type="button" className="btn btn-ghost danger-text" onClick={() => onDelete(panel)} aria-label="Eliminar panel">
          <Trash2 size={16} />
        </button>
      </div>
    </article>
  );
}
