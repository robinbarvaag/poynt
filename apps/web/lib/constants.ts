import type { IconName } from "@poynt/ui/icons";
import type { MedalConfigItem } from "./types";

export const mainNavItems: {
  title: string;
  url: string;
  icon: IconName;
  requiresAi?: boolean;
}[] = [
  {
    title: "Hjem",
    url: "/on-poynt/oversikt",
    icon: "home",
  },
  {
    title: "Bedrifter",
    url: "/on-poynt/bedrifter",
    icon: "building-2",
  },
  {
    title: "Artiklar",
    url: "/on-poynt/artiklar",
    icon: "newspaper",
  },
  {
    title: "Kurs",
    url: "/on-poynt/kurs",
    icon: "graduation-cap",
  },
  {
    title: "Ressurser",
    url: "/on-poynt/ressurser",
    icon: "layers",
  },
  {
    title: "Kanalveileder",
    url: "/on-poynt/verktoy/kanalveileder",
    icon: "compass",
    requiresAi: true,
  },
  {
    title: "Markedsplan",
    url: "/on-poynt/verktoy/markedsplan",
    icon: "bar-chart",
    requiresAi: true,
  },
  {
    title: "Si nei-generator",
    url: "/on-poynt/verktoy/avslag-generator",
    icon: "hand-metal",
    requiresAi: true,
  },
  {
    title: "Årshjul",
    url: "/on-poynt/verktoy/arsplanlegger",
    icon: "calendar-days",
    requiresAi: true,
  },
  {
    title: "Podcast til innhald",
    url: "/on-poynt/verktoy/podcast-til-innhald",
    icon: "mic",
    requiresAi: true,
  },
];

export const settingsNavItems: {
  title: string;
  url: string;
  icon: IconName;
}[] = [
  {
    title: "Bedrift",
    url: "/on-poynt/innstillinger/arbeidsomrade",
    icon: "building-2",
  },
  {
    title: "Abonnement",
    url: "/on-poynt/innstillinger/medlemskap",
    icon: "credit-card",
  },
];

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

export const tools: {
  icon: IconName;
  title: string;
  description: string;
  href: string;
  gradient: string;
  benefits: string[];
}[] = [
  {
    icon: "compass",
    title: "Kanalveileder",
    description:
      "Finn de beste markedsføringskanalene for din bedrift basert på målgruppe og ressurser.",
    href: "/on-poynt/verktoy/kanalveileder",
    gradient: "from-sky-400/80 to-teal-400/80",
    benefits: ["Personlig analyse", "Prioritert liste"],
  },
  {
    icon: "file-text",
    title: "Markedsplan-generator",
    description:
      "Lag en komplett markedsplan med innholdsstrategi og publiseringsfrekvens.",
    href: "/on-poynt/verktoy/markedsplan",
    gradient: "from-violet-400/80 to-indigo-400/80",
    benefits: ["Skreddersydd", "Ukentlig plan"],
  },
  {
    icon: "hand-metal",
    title: "Si nei-generator",
    description: "Avslå forespørsler profesjonelt uten å brenne broer.",
    href: "/on-poynt/verktoy/avslag-generator",
    gradient: "from-amber-400/80 to-orange-400/80",
    benefits: ["Profesjonelt", "Vennlig tone"],
  },
  {
    icon: "calendar",
    title: "Årshjul",
    description:
      "Planlegg innholdet ditt gjennom året med AI-genererte forslag.",
    href: "/on-poynt/verktoy/arsplanlegger",
    gradient: "from-emerald-400/80 to-teal-400/80",
    benefits: ["12 måneder", "Sesongbasert"],
  },
  {
    icon: "mic",
    title: "Podcast til innhald",
    description:
      "Last opp ein podkast-episode og få blogginnlegg, sosiale postar og kapittelmerke automatisk.",
    href: "/on-poynt/verktoy/podcast-til-innhald",
    gradient: "from-pink-400/80 to-rose-400/80",
    benefits: ["Whisper AI", "3 format på ein gong"],
  },
];

export const quickActions = [
  {
    title: "Lag avslag",
    description: "Profesjonelt nei",
    href: "/on-poynt/verktoy/avslag-generator",
    icon: "hand-metal" as IconName,
  },
  {
    title: "Ny markedsplan",
    description: "Komplett strategi",
    href: "/on-poynt/verktoy/markedsplan",
    icon: "file-text" as IconName,
  },
  {
    title: "Finn kanaler",
    description: "Beste plattformer",
    href: "/on-poynt/verktoy/kanalveileder",
    icon: "compass" as IconName,
  },
  {
    title: "Planlegg året",
    description: "Innholdskalender",
    href: "/on-poynt/verktoy/arsplanlegger",
    icon: "calendar" as IconName,
  },
];

export const adminNavItems: {
  title: string;
  href: string;
  icon: IconName;
  disabled?: boolean;
}[] = [
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

export const stats: {
  title: string;
  value: string;
  description: string;
  href: string;
  icon: IconName;
  disabled?: boolean;
}[] = [
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
