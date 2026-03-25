import { Eye, Crosshair, Shield, Swords, LocateFixed } from 'lucide-react';
import type { PlayerRole } from '@/lib/types';
import type { LucideProps } from 'lucide-react';

const roleIcons: Record<PlayerRole, React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>> = {
  'IGL': Eye,
  'Entry Fragger': Crosshair,
  'Support': Shield,
  'Assaulter': Swords,
  'Sniper': LocateFixed,
};

export function RoleIcon({ role, className }: { role: PlayerRole; className?: string }) {
  const Icon = roleIcons[role];
  return Icon ? <Icon className={className} /> : null;
}
