import { useEffect, useState, type FormEvent } from 'react';
import { Modal } from './Modal';

interface PanelFormProps {
  open: boolean;
  title: string;
  initialName?: string;
  submitLabel: string;
  onSubmit: (name: string) => void;
  onClose: () => void;
}

export function PanelForm({
  open,
  title,
  initialName = '',
  submitLabel,
  onSubmit,
  onClose,
}: PanelFormProps) {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (open) setName(initialName);
  }, [open, initialName]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="submit"
            form="panel-form"
            className="btn btn-primary"
            disabled={!name.trim()}
          >
            {submitLabel}
          </button>
        </>
      }
    >
      <form id="panel-form" onSubmit={handleSubmit} className="form-stack">
        <label>
          <span>Nombre del panel</span>
          <input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ej. Ordenadores del SOC"
            required
          />
        </label>
      </form>
    </Modal>
  );
}
