import React from 'react';
import {
  AlertCircle,
  ArrowLeftRight,
  ArrowRight,
  Ban,
  BadgeCheck,
  Banknote,
  Bell,
  Briefcase,
  Building2,
  Calculator,
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
  CloudCheck,
  CloudCog,
  CloudOff,
  CloudUpload,
  Database,
  Download,
  Eye,
  EyeOff,
  FileEdit,
  FileText,
  FolderOpen,
  Hourglass,
  KeyRound,
  Landmark,
  LayoutGrid,
  Lock,
  LogOut,
  MailCheck,
  Pencil,
  Play,
  Plus,
  QrCode,
  Receipt,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Tag,
  Trash2,
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
  calculate: Calculator,
  delete: Trash2,
  play_arrow: Play,
  refresh: RefreshCw,
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
  shield_check: ShieldCheck,
  qr_code: QrCode,
  lock_reset: KeyRound,
  mark_email_read: MailCheck,

  // Integrasi / handoff ke Sianggar
  cloud_done: CloudCheck,
  cloud_sync: CloudCog,
  cloud_off: CloudOff,
  cloud_upload: CloudUpload,
  sync_alt: ArrowLeftRight,

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
