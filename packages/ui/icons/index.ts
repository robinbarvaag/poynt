/**
 * Icons module
 *
 * Primary usage (recommended):
 *   import { Icon } from "@poynt/ui/icons"
 *   <Icon name="home" className="size-4" />
 *
 * Legacy usage (still supported):
 *   import { Home, Settings, User } from "@poynt/ui/icons"
 *
 * This centralizes icon management and makes it easy to:
 * - Switch icon libraries in the future
 * - Add custom icons alongside lucide icons
 * - Maintain consistency across the app
 * - Get type-safe icon names
 */

// New Icon component (recommended)
export { Icon, getIconComponent, isValidIconName, iconNames } from "./icon";
export type { IconName, IconProps } from "./icon";

// Legacy re-exports for backwards compatibility
export {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  Banknote as BanknoteIcon,
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
  Mail,
  Medal,
  Megaphone,
  MessageSquare,
  Mic,
  Moon,
  MoreHorizontal,
  Music,
  Newspaper,
  Palette,
  Pencil,
  PenTool,
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

// Re-export type for icon components
export type { LucideIcon, LucideProps } from "lucide-react";
