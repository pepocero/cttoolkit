export type ActionType =
  | 'url'
  | 'network'
  | 'windows'
  | 'cmd'
  | 'powershell'
  | 'custom';

export interface Action {
  id: string;
  name: string;
  type: ActionType;
  value: string;
  description?: string;
  favorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  url: 'URL / Página web',
  network: 'Ruta de red',
  windows: 'Comando Windows',
  cmd: 'Comando CMD',
  powershell: 'Comando PowerShell',
  custom: 'Personalizado',
};

export const ACTION_TYPES: ActionType[] = [
  'url',
  'network',
  'windows',
  'cmd',
  'powershell',
  'custom',
];
