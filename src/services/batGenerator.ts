import type { Action, ActionType } from '../types';
import { sanitizeFilename } from '../utils/filename';

function escapeForDoubleQuotes(value: string): string {
  return value.replace(/"/g, '""');
}

function wrapQuoted(value: string): string {
  return `"${escapeForDoubleQuotes(value)}"`;
}

export function generateBatContent(action: Pick<Action, 'type' | 'value'>): string {
  const value = action.value.trim();
  const type: ActionType = action.type;

  switch (type) {
    case 'url':
      return [
        '@echo off',
        `start "" ${wrapQuoted(value)}`,
        '',
      ].join('\r\n');

    case 'network':
      return [
        '@echo off',
        `start "" ${wrapQuoted(value)}`,
        '',
      ].join('\r\n');

    case 'windows':
      return [
        '@echo off',
        `start "" ${value}`,
        '',
      ].join('\r\n');

    case 'cmd':
      return [
        '@echo off',
        'REM CT Toolkit — comando CMD',
        value,
        'if errorlevel 1 pause',
        '',
      ].join('\r\n');

    case 'powershell': {
      const escaped = value.replace(/'/g, "''");
      return [
        '@echo off',
        'REM CT Toolkit — invocación PowerShell',
        `powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ${wrapQuoted(escaped)}`,
        'if errorlevel 1 pause',
        '',
      ].join('\r\n');
    }

    case 'custom':
    default:
      return [
        '@echo off',
        'REM CT Toolkit — acción personalizada',
        value,
        'if errorlevel 1 pause',
        '',
      ].join('\r\n');
  }
}

export function downloadBat(action: Pick<Action, 'name' | 'type' | 'value'>): void {
  const content = generateBatContent(action);
  const filename = sanitizeFilename(action.name, 'bat');
  const blob = new Blob([content], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
