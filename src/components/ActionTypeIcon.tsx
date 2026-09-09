import {
  Globe,
  HardDrive,
  AppWindow,
  Terminal,
  SquareTerminal,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { ActionType } from '../types';

const ICONS: Record<ActionType, LucideIcon> = {
  url: Globe,
  network: HardDrive,
  windows: AppWindow,
  cmd: Terminal,
  powershell: SquareTerminal,
  custom: Wrench,
};

export function ActionTypeIcon({ type, size = 18 }: { type: ActionType; size?: number }) {
  const Icon = ICONS[type] ?? Wrench;
  return <Icon size={size} aria-hidden />;
}
