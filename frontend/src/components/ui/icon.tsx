import React from 'react';
import {
  AlertCircle,
  ArrowRight,
  Ban,
  BadgeCheck,
  Banknote,
  Bell,
  Briefcase,
  Building2,
  Calendar,
  CalendarCheck,
  Check,
  CircleCheck,
  CircleDollarSign,
  CirclePlus,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Database,
  Download,
  Eye,
  EyeOff,
  FileEdit,
  FileText,
  FolderOpen,
  Hourglass,
  Landmark,
  LayoutGrid,
  Lock,
  LogOut,
  Pencil,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  Send,
  Settings,
  Tag,
  Upload,
  User,
  UserPlus,
  Users,
  Wallet,
  X,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Maps this app's original Material Symbols icon names (used
 * throughout as `<Icon name="...">`) to Lucide components — switched
 * to Lucide's consistent-stroke line style for a fresher, more
 * eye-catching look per user request, without touching every call
 * site. Add new entries here rather than introducing a second
 * icon system.
 */
const ICONS: Record<string, LucideIcon> = {
  // Actions / UI
  add: Plus,
  arrow_forward: ArrowRight,
  cancel: XCircle,
  check: Check,
  check_circle: CircleCheck,
  chevron_right: ChevronRight,
  close: X,
  description: FileText,
  download: Download,
  edit: Pencil,
  edit_note: FileEdit,
  error: AlertCircle,
  expand_more: ChevronDown,
  lock: Lock,
  logout: LogOut,
  notifications: Bell,
  person: User,
  person_add: UserPlus,
  search: Search,
  send: Send,
  upload_file: Upload,
  visibility: Eye,
  visibility_off: EyeOff,
  block: Ban,
  restart_alt: RotateCcw,
  verified: BadgeCheck,

  // Navigation / domain
  grid_view: LayoutGrid,
  database: Database,
  badge: Users,
  corporate_fare: Briefcase,
  domain: Building2,
  event_note: ClipboardList,
  payments: Banknote,
  price_change: Tag,
  account_balance: Landmark,
  event_available: CalendarCheck,
  calendar_month: Calendar,
  add_circle: CirclePlus,
  hourglass_top: Hourglass,
  task_alt: ClipboardCheck,
  receipt_long: Receipt,
  account_balance_wallet: Wallet,
  price_check: CircleDollarSign,
  folder_open: FolderOpen,
  settings: Settings,
};

export interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, 'name' | 'fill'> {
  name: string;
  className?: string;
  /**
   * Bolder stroke for emphasis (e.g. dashboard KPI badges). NOT a
   * solid/filled render — Lucide's paths aren't designed as closed
   * silhouettes, so fill="currentColor" on an arbitrary icon renders as
   * a muddy blob rather than a clean glyph. Bumping stroke width is the
   * correct way to add visual weight here.
   */
  fill?: boolean;
}

export function Icon({ name, className, fill, ...props }: IconProps) {
  const LucideComponent = ICONS[name];

  if (!LucideComponent) {
    // Fail loud in development so a missing mapping is caught immediately
    // instead of silently rendering nothing.
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`Icon: no Lucide mapping for "${name}" — add it to ICONS in components/ui/icon.tsx.`);
    }
    return null;
  }

  return (
    <LucideComponent
      className={cn('icon-glyph inline-block shrink-0', className)}
      aria-hidden="true"
      size="1em"
      strokeWidth={fill ? 2.5 : 2}
      {...props}
    />
  );
}

export default Icon;
