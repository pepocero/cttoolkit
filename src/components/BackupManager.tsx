import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Modal } from './Modal';
import type { ImportMode } from '../services/backupService';

export function BackupManager() {
  const { exportBackup, importBackup } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const openPicker = () => {
    setError(null);
    setSuccess(null);
    inputRef.current?.click();
  };

  const onFileChange = (file: File | null) => {
    if (!file) return;
    setPendingFile(file);
  };

  const runImport = async (mode: ImportMode) => {
    if (!pendingFile) return;
    setBusy(true);
    setError(null);
    try {
      const result = await importBackup(pendingFile, mode);
      setSuccess(
        mode === 'replace'
          ? `Datos reemplazados: ${result.panelsImported} paneles, ${result.actionsImported} acciones.`
          : `Datos combinados: ${result.panelsImported} paneles afectados, ${result.actionsImported} acciones procesadas.`,
      );
      setPendingFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al importar.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <section className="backup-card">
      <div>
        <h2>Copia de seguridad</h2>
        <p className="text-muted">
          Tus paneles se guardan en Cloudflare D1, aislados por usuario. Exporta o importa JSON
          como copia de seguridad adicional.
        </p>
      </div>

      <div className="backup-card__actions">
        <button type="button" className="btn btn-secondary" onClick={exportBackup}>
          <Download size={16} /> Exportar JSON
        </button>
        <button type="button" className="btn btn-secondary" onClick={openPicker}>
          <Upload size={16} /> Importar JSON
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
        />
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {success ? <p className="form-success">{success}</p> : null}

      <Modal
        open={Boolean(pendingFile)}
        title="Importar configuración"
        onClose={() => {
          setPendingFile(null);
          if (inputRef.current) inputRef.current.value = '';
        }}
        footer={
          <>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={busy}
              onClick={() => {
                setPendingFile(null);
                if (inputRef.current) inputRef.current.value = '';
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={busy}
              onClick={() => runImport('merge')}
            >
              Combinar
            </button>
            <button
              type="button"
              className="btn btn-danger"
              disabled={busy}
              onClick={() => runImport('replace')}
            >
              Reemplazar todo
            </button>
          </>
        }
      >
        <p className="text-muted">
          Archivo: <strong>{pendingFile?.name}</strong>
        </p>
        <p>
          Antes de sobrescribir, elige cómo aplicar la copia de seguridad:
        </p>
        <ul className="import-options">
          <li>
            <strong>Reemplazar todos los datos</strong> — borra paneles actuales y carga el JSON.
          </li>
          <li>
            <strong>Combinar</strong> — añade paneles/acciones nuevos y actualiza los que coincidan por id.
          </li>
          <li>
            <strong>Cancelar</strong> — no modifica nada.
          </li>
        </ul>
      </Modal>
    </section>
  );
}
