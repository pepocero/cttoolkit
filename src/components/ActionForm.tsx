import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { Action, ActionType } from '../types';
import { ACTION_TYPES, ACTION_TYPE_LABELS } from '../types';
import { validateActionValue } from '../utils/validation';
import { Modal } from './Modal';
import type { ActionInput } from '../context/AppContext';

interface ActionFormProps {
  open: boolean;
  title: string;
  initial?: Partial<Action>;
  submitLabel: string;
  onSubmit: (input: ActionInput) => void;
  onClose: () => void;
}

export function ActionForm({
  open,
  title,
  initial,
  submitLabel,
  onSubmit,
  onClose,
}: ActionFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<ActionType>('url');
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setType(initial?.type ?? 'url');
    setValue(initial?.value ?? '');
    setDescription(initial?.description ?? '');
    setFavorite(Boolean(initial?.favorite));
  }, [open, initial]);

  const validation = useMemo(() => validateActionValue(type, value), [type, value]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !value.trim()) return;
    onSubmit({
      name,
      type,
      value,
      description,
      favorite,
    });
  };

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      wide
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="submit"
            form="action-form"
            className="btn btn-primary"
            disabled={!name.trim() || !value.trim()}
          >
            {submitLabel}
          </button>
        </>
      }
    >
      <form id="action-form" onSubmit={handleSubmit} className="form-stack">
        <label>
          <span>Nombre de la acción</span>
          <input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ej. Authenticator"
            required
          />
        </label>

        <label>
          <span>Tipo</span>
          <select value={type} onChange={(event) => setType(event.target.value as ActionType)}>
            {ACTION_TYPES.map((item) => (
              <option key={item} value={item}>
                {ACTION_TYPE_LABELS[item]}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Valor</span>
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            rows={4}
            placeholder="URL, ruta UNC o comando…"
            required
          />
        </label>

        {validation.message ? <p className="form-error">{validation.message}</p> : null}
        {validation.warning ? <p className="form-warning">{validation.warning}</p> : null}

        <label>
          <span>Descripción (opcional)</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={2}
            placeholder="Notas sobre qué hace esta acción"
          />
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={favorite}
            onChange={(event) => setFavorite(event.target.checked)}
          />
          <span>Marcar como favorita</span>
        </label>
      </form>
    </Modal>
  );
}
