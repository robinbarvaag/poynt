import type { IconName } from "@poynt/ui/icons";

export type NavItem = {
  title: string;
  url: string;
  icon: IconName;
  requiresAi?: boolean;
};

/** Øverst, alene (ikke et «verktøy»). */
export const homeNavItem: NavItem = {
  title: "Hjem",
  url: "/on-poynt/oversikt",
  icon: "home",
};

/** Gruppe «Verktøy» — kun AI-verktøyene (tier-låst). */
export const toolNavItems: NavItem[] = [
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
    title: "Si nei med stil",
    url: "/on-poynt/verktoy/avslag-generator",
    icon: "message-square-off",
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

/**
 * Gruppe «Læring» — alt mykt innhold (guider, artikler, kurs) samlet i én hub.
 * Detalj-rutene (/ressurser, /artikler, /kurs) består; list-rutene redirecter hit.
 */
export const learnNavItems: NavItem[] = [
  {
    title: "Læring",
    url: "/on-poynt/laering",
    icon: "compass",
  },
];

/** Gruppe «Konto» — min bedrift og abonnement. */
export const accountNavItems: NavItem[] = [
  {
    title: "Min bedrift",
    url: "/on-poynt/bedrifter",
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
  benefits: string[];
}[] = [
  {
    icon: "compass",
    title: "Kanalveileder",
    description:
      "Finn de beste markedsføringskanalene for din bedrift basert på målgruppe og ressurser.",
    href: "/on-poynt/verktoy/kanalveileder",
    benefits: ["Personlig analyse", "Prioritert liste"],
  },
  {
    icon: "file-text",
    title: "Markedsplan-generator",
    description:
      "Lag en komplett markedsplan med innholdsstrategi og publiseringsfrekvens.",
    href: "/on-poynt/verktoy/markedsplan",
    benefits: ["Skreddersydd", "Ukentlig plan"],
  },
  {
    icon: "message-square-off",
    title: "Si nei med stil",
    description:
      "Lag høflige, profesjonelle avslag på forespørsler du ikke rekker — uten å brenne broer.",
    href: "/on-poynt/verktoy/avslag-generator",
    benefits: ["Profesjonelt", "Vennlig tone"],
  },
  {
    icon: "calendar",
    title: "Årshjul",
    description:
      "Planlegg innholdet ditt gjennom året med AI-genererte forslag.",
    href: "/on-poynt/verktoy/arsplanlegger",
    benefits: ["12 måneder", "Sesongbasert"],
  },
  {
    icon: "mic",
    title: "Podcast til innhald",
    description:
      "Last opp ein podkast-episode og få blogginnlegg, sosiale postar og kapittelmerke automatisk.",
    href: "/on-poynt/verktoy/podcast-til-innhald",
    benefits: ["Whisper AI", "3 format på ein gong"],
  },
];

export const quickActions = [
  {
    title: "Si nei med stil",
    description: "Høflige avslag",
    href: "/on-poynt/verktoy/avslag-generator",
    icon: "message-square-off" as IconName,
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

/**
 * Prioritet vises som en dempet Badge (samme rolige uttrykk som match-nivå i
 * kanalveilederen) i stedet for hardkodede grønn/gul/slate-farger.
 */
export const priorityConfig: Record<
  "high" | "medium" | "low",
  { label: string; badge: "soft-primary" | "secondary" | "outline" }
> = {
  high: { label: "Høy prioritet", badge: "soft-primary" },
  medium: { label: "Medium prioritet", badge: "secondary" },
  low: { label: "Lav prioritet", badge: "outline" },
};
