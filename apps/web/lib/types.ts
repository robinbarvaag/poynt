import { IconName } from "@poynt/ui/icons";

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