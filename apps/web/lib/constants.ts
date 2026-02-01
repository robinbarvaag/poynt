import { IconName } from "@poynt/ui/icons";
import { MedalConfigItem, Tool } from "./types";

export const mainNavItems: { title: string; url: string; icon: IconName }[] = [
  {
    title: "Hjem",
    url: "/dashboard",
    icon: "home",
  },
  {
    title: "Kanalveileder",
    url: "/planner/tools/channel-guide",
    icon: "compass",
  },
  {
    title: "Markedsplan",
    url: "/planner/tools/marketing-plan",
    icon: "bar-chart",
  },
  {
    title: "Si nei-generator",
    url: "/planner/tools/decline-generator",
    icon: "hand-metal",
  },
  {
    title: "Årshjul",
    url: "/planner/tools/yearly-planner",
    icon: "calendar-days",
  },
];

export const settingsNavItems: { title: string; url: string; icon: IconName }[] = [
  {
    title: "Bedrift",
    url: "/planner/settings/workspace",
    icon: "building-2",
  },
  {
    title: "Abonnement",
    url: "/planner/settings/subscription",
    icon: "credit-card",
  },
];

export const tools = [
  {
    icon: "compass",
    title: "Kanalveileder",
    description: "Finn de beste markedsføringskanalene for din bedrift",
    href: "/planner/tools/channel-guide",
    available: true,
  },
  {
    icon: "file-text",
    title: "Markedsplan-generator",
    description: "Lag en komplett markedsplan med AI",
    href: "/planner/tools/marketing-plan",
    available: true,
  },
  {
    icon: "hand-metal",
    title: "Si nei-generator",
    description: "Avslå forespørsler profesjonelt",
    href: "/planner/tools/decline-generator",
    available: true,
  },
  {
    icon: "calendar",
    title: "Årshjul",
    description: "Planlegg innholdet ditt gjennom året",
    href: "/planner/tools/yearly-planner",
    available: true,
  },
] as Tool[];

export const tierConfig = {
  free: {
    icon: "zap" as IconName,
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-100 dark:bg-slate-800",
  },
  pro: {
    icon: "rocket" as IconName,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  business: {
    icon: "crown" as IconName,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
  },
};

export const adminNavItems: { title: string; href: string; icon: IconName; disabled?: boolean }[] = [
  {
    title: "Oversikt",
    href: "/admin",
    icon: "layout-list",
  },
  {
    title: "Bransjer",
    href: "/admin/industries",
    icon: "building-2",
  },
  {
    title: "Prompt Templates",
    href: "/admin/prompts",
    icon: "file-text",
    disabled: true,
  },
  {
    title: "Brukere",
    href: "/admin/users",
    icon: "users",
    disabled: true,
  },
];

export const stats: { title: string; value: string; description: string; href: string; icon: IconName; disabled?: boolean }[] = [
  {
    title: "Bransjer",
    value: "20",
    description: "Aktive bransjer",
    href: "/admin/industries",
    icon: "building-2",
  },
  {
    title: "Prompt Templates",
    value: "0",
    description: "Kommer snart",
    href: "/admin/prompts",
    icon: "file-text",
    disabled: true,
  },
  {
    title: "Brukere",
    value: "-",
    description: "Kommer snart",
    href: "/admin/users",
    icon: "users",
    disabled: true,
  },
];

export const medalConfig: MedalConfigItem[] = [
  {
    icon: "trophy",
    emoji: "🥇",
    gradient: "from-yellow-500/20 to-amber-500/20",
    border: "border-yellow-500/50",
    iconColor: "text-yellow-500",
    progressColor: "bg-yellow-500",
  },
  {
    icon: "medal",
    emoji: "🥈",
    gradient: "from-slate-300/20 to-slate-400/20",
    border: "border-slate-400/50",
    iconColor: "text-slate-400",
    progressColor: "bg-slate-400",
  },
  {
    icon: "award",
    emoji: "🥉",
    gradient: "from-orange-400/20 to-orange-500/20",
    border: "border-orange-500/50",
    iconColor: "text-orange-500",
    progressColor: "bg-orange-500",
  },
];

export const channelLinks: Record<string, string> = {
  LinkedIn: "https://linkedin.com",
  Instagram: "https://instagram.com",
  Facebook: "https://facebook.com",
  TikTok: "https://tiktok.com",
  YouTube: "https://youtube.com",
  "E-post/Nyhetsbrev": "#",
  Podcast: "#",
  Twitter: "https://twitter.com",
  X: "https://x.com",
  Blogg: "#",
};

export const priorityConfig = {
  high: {
    label: "Høy prioritet",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
  },
  medium: {
    label: "Medium prioritet",
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
  },
  low: {
    label: "Lav prioritet",
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/30",
  },
};