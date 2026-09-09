import type { ActionType } from '../types';

export interface ValidationResult {
  ok: boolean;
  message?: string;
  warning?: string;
}

const URL_PATTERN = /^https?:\/\/.+/i;
const UNC_PATTERN = /^\\\\[^\\]+(\\.*)?$/;

export function validateActionValue(type: ActionType, value: string): ValidationResult {
  const trimmed = value.trim();

  if (!trimmed) {
    return {
      ok: false,
      message: 'El valor no puede estar vacío.',
    };
  }

  switch (type) {
    case 'url':
      if (!URL_PATTERN.test(trimmed)) {
        return {
          ok: true,
          warning: 'Las URL suelen empezar por http:// o https://. Se guardará igualmente.',
        };
      }
      if (typeof URL.canParse === 'function' && !URL.canParse(trimmed)) {
        return {
          ok: true,
          warning: 'El formato de URL parece incompleto. Se guardará igualmente.',
        };
      }
      return { ok: true };

    case 'network':
      if (!UNC_PATTERN.test(trimmed)) {
        return {
          ok: true,
          warning: 'Las rutas de red UNC suelen verse así: \\\\servidor\\recurso. Se guardará igualmente.',
        };
      }
      return { ok: true };

    case 'windows':
    case 'cmd':
    case 'powershell':
    case 'custom':
      return { ok: true };

    default:
      return { ok: true };
  }
}

export function normalizeNetworkPath(value: string): string {
  return value.trim();
}
