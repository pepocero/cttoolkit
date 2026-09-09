import { slugify } from './id';

const INVALID_FILENAME_CHARS = /[<>:"/\\|?*\u0000-\u001f]/g;

export function sanitizeFilename(name: string, extension = 'bat'): string {
  const base = slugify(name)
    .replace(INVALID_FILENAME_CHARS, '-')
    .replace(/\.+$/g, '')
    .slice(0, 100);

  const safeBase = base || 'accion';
  return `${safeBase}.${extension.replace(/^\./, '')}`;
}
