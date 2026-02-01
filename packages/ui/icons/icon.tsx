"use client";

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  Banknote,
  BarChart3,
  Briefcase,
  Building,
  Building2,
  Calendar,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  CircleOff,
  Clock,
  Compass,
  Copy,
  CreditCard,
  Crown,
  DollarSign,
  ExternalLink,
  Eye,
  Facebook,
  FileText,
  Flame,
  GraduationCap,
  GripVertical,
  HandMetal,
  Handshake,
  Headphones,
  Heart,
  Home,
  Image,
  Instagram,
  Landmark,
  Layers,
  LayoutList,
  Lightbulb,
  Linkedin,
  Loader2,
  LogOut,
  type LucideProps,
  Mail,
  Medal,
  Megaphone,
  MessageSquare,
  MessageSquareOff,
  Mic,
  Moon,
  MoreHorizontal,
  Music,
  Newspaper,
  Palette,
  PenTool,
  Pencil,
  Plus,
  RefreshCcw,
  Rocket,
  Send,
  Settings,
  Share2,
  Shield,
  Sparkles,
  Sun,
  Target,
  ThumbsDown,
  ThumbsUp,
  Timer,
  Trash2,
  Trophy,
  User,
  UserCircle,
  UserCog,
  UserPlus,
  Users,
  Wallet,
  X,
  Youtube,
  Zap,
} from "lucide-react";

/**
 * Map of all available icons
 */
const iconMap = {
  "alert-triangle": AlertTriangle,
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  award: Award,
  banknote: Banknote,
  "bar-chart": BarChart3,
  briefcase: Briefcase,
  building: Building,
  "building-2": Building2,
  calendar: Calendar,
  "calendar-clock": CalendarClock,
  "calendar-days": CalendarDays,
  check: Check,
  "check-circle": CheckCircle2,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  "chevrons-up-down": ChevronsUpDown,
  "circle-off": CircleOff,
  clock: Clock,
  compass: Compass,
  copy: Copy,
  "credit-card": CreditCard,
  crown: Crown,
  dollar: DollarSign,
  "external-link": ExternalLink,
  eye: Eye,
  facebook: Facebook,
  "file-text": FileText,
  flame: Flame,
  "graduation-cap": GraduationCap,
  "grip-vertical": GripVertical,
  "hand-metal": HandMetal,
  handshake: Handshake,
  headphones: Headphones,
  heart: Heart,
  home: Home,
  image: Image,
  instagram: Instagram,
  landmark: Landmark,
  layers: Layers,
  "layout-list": LayoutList,
  lightbulb: Lightbulb,
  linkedin: Linkedin,
  loader: Loader2,
  "log-out": LogOut,
  mail: Mail,
  medal: Medal,
  megaphone: Megaphone,
  "message-square": MessageSquare,
  "message-square-off": MessageSquareOff,
  mic: Mic,
  moon: Moon,
  "more-horizontal": MoreHorizontal,
  music: Music,
  newspaper: Newspaper,
  palette: Palette,
  pencil: Pencil,
  "pen-tool": PenTool,
  plus: Plus,
  refresh: RefreshCcw,
  rocket: Rocket,
  send: Send,
  settings: Settings,
  share: Share2,
  shield: Shield,
  sparkles: Sparkles,
  sun: Sun,
  target: Target,
  timer: Timer,
  "thumbs-down": ThumbsDown,
  "thumbs-up": ThumbsUp,
  trash: Trash2,
  trophy: Trophy,
  user: User,
  "user-circle": UserCircle,
  "user-cog": UserCog,
  "user-plus": UserPlus,
  users: Users,
  wallet: Wallet,
  x: X,
  youtube: Youtube,
  zap: Zap,
  ads: Target,
} as const;

/**
 * All available icon names
 */
export type IconName = keyof typeof iconMap;

/**
 * Get all available icon names
 */
export const iconNames = Object.keys(iconMap) as IconName[];

/**
 * Icon component props
 */
export interface IconProps extends Omit<LucideProps, "ref"> {
  /** The name of the icon to render */
  name: IconName;
}

/**
 * Icon component that renders icons by name
 *
 * @example
 * ```tsx
 * <Icon name="home" className="size-4" />
 * <Icon name="settings" size={24} />
 * <Icon name="sparkles" className="text-primary" />
 * ```
 */
export function Icon({ name, ...props }: IconProps) {
  const IconComponent = iconMap[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  return <IconComponent {...props} />;
}

/**
 * Get an icon component by name (for cases where you need the component itself)
 */
export function getIconComponent(name: IconName) {
  return iconMap[name];
}

/**
 * Check if a string is a valid icon name
 */
export function isValidIconName(name: string): name is IconName {
  return name in iconMap;
}
