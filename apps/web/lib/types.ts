import type { IconName } from "@poynt/ui/icons";

export type Tool = {
  icon: IconName;
  title: string;
  description: string;
  href: string;
  available: boolean;
};

export interface ChannelRecommendation {
  name: string;
  matchPercent: number;
  reason: string;
  whyNotHigher?: string;
  timeToResults?: string;
  weeklyTimeNeeded?: string;
  idealFor?: string[];
  challengingIf?: string[];
}

export interface GuideResultProps {
  channels?: ChannelRecommendation[];
  reasoning?: string | null;
  onReset?: () => void;
  mode?: "intro" | "result";
  onStartQuiz?: () => void;
}

export interface MedalConfigItem {
  icon: IconName;
  emoji: string;
  gradient: string;
  border: string;
  iconColor: string;
  progressColor: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  role?: "owner" | "admin" | "member" | "client";
}

export interface SavedResult {
  id: string;
  channels: ChannelRecommendation[];
  reasoning?: string;
  createdAt: Date;
}

export interface Industry {
  id: string;
  name: string;
  icon: string | null;
  isActive: boolean;
}

export type ViewState = "intro" | "saved" | "quiz" | "result";

// Medal config for the 3 channels
export type MedalConfig = {
  icon: "trophy" | "medal" | "award";
  color: string;
  bg: string;
};

export const medalConfigs: MedalConfig[] = [
  { icon: "trophy", color: "text-yellow-500", bg: "bg-yellow-500/10" },
  { icon: "medal", color: "text-slate-400", bg: "bg-slate-400/10" },
  { icon: "award", color: "text-amber-600", bg: "bg-amber-600/10" },
];

export interface ChannelGuideClientProps {
  initialSavedResult: SavedResult | null;
  industries: Industry[];
  initialIndustryId: string | null;
  initialTargetAudience: "b2b" | "b2c" | "both" | null;
}

export interface ExtendedGuideResultProps extends GuideResultProps {
  mode?: "intro" | "result";
  onStartQuiz?: () => void;
}
