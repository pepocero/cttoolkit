import { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Pencil,
  Star,
  Trash2,
} from 'lucide-react';
import type { Action } from '../types';
import { ACTION_TYPE_LABELS } from '../types';
import { ActionTypeIcon } from './ActionTypeIcon';
import { copyToClipboard } from '../utils/clipboard';
import { downloadBat } from '../services/batGenerator';
import { DropdownMenu } from './DropdownMenu';

interface ActionCardProps {
  action: Action;
  panelName?: string;
  onEdit: (action: Action) => void;
  onDuplicate: (action: Action) => void;
  onDelete: (action: Action) => void;
  onToggleFavorite: (action: Action) => void;
}

export function ActionCard({
  action,
  panelName,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleFavorite,
}: ActionCardProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    const ok = await copyToClipboard(action.value);
    if (ok) setCopied(true);
  };

  const canOpenUrl = action.type === 'url' && /^https?:\/\//i.test(action.value.trim());

  return (
    <article className="action-card">
      <div className="action-card__header">
        <div className="action-card__title">
          <span className="action-card__type-icon">
            <ActionTypeIcon type={action.type} size={20} />
          </span>
          <div>
            <h3>{action.name}</h3>
            <p className="action-card__type">{ACTION_TYPE_LABELS[action.type]}</p>
            {panelName ? <p className="action-card__panel">{panelName}</p> : null}
          </div>
        </div>

        <div className="action-card__header-actions">
          <button
            type="button"
            className={`icon-btn ${action.favorite ? 'is-favorite' : ''}`}
            onClick={() => onToggleFavorite(action)}
            aria-label={action.favorite ? 'Quitar de favoritos' : 'Marcar como favorita'}
            title={action.favorite ? 'Quitar de favoritos' : 'Marcar como favorita'}
          >
            <Star size={18} fill={action.favorite ? 'currentColor' : 'none'} />
          </button>

          <DropdownMenu
            items={[
              {
                id: 'edit',
                label: 'Editar',
                icon: <Pencil size={14} />,
                onSelect: () => onEdit(action),
              },
              {
                id: 'duplicate',
                label: 'Duplicar',
                icon: <Copy size={14} />,
                onSelect: () => onDuplicate(action),
              },
              {
                id: 'delete',
                label: 'Eliminar',
                icon: <Trash2 size={14} />,
                danger: true,
                onSelect: () => onDelete(action),
              },
            ]}
          />
        </div>
      </div>

      {action.description ? <p className="action-card__desc">{action.description}</p> : null}

      <pre className="action-card__value">{action.value}</pre>

      <div className="action-card__buttons">
        {canOpenUrl ? (
          <a
            className="btn btn-secondary"
            href={action.value.trim()}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink size={16} /> Abrir
          </a>
        ) : null}

        <button type="button" className="btn btn-secondary" onClick={handleCopy}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>

        <button type="button" className="btn btn-secondary" onClick={() => downloadBat(action)}>
          <Download size={16} /> Descargar .BAT
        </button>
      </div>
    </article>
  );
}
