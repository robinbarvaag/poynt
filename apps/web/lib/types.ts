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
  // Nytt, ærlig felt. matchPercent beholdes valgfritt for gamle lagrede resultater.
  matchLevel?: "strong" | "good" | "possible";
  matchPercent?: number;
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
  /** Konkrete neste steg for toppkanalen (denne uken) — løftet opp i resultatet. */
  nextSteps?: string[] | null;
  onReset?: () => void;
  /** Når true bygger resultatet seg fortsatt opp (streaming): vis skjelett + status. */
  isStreaming?: boolean;
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
  nextSteps?: string[];
  createdAt: Date;
}

export interface Industry {
  id: string;
  name: string;
  icon: string | null;
  isActive: boolean;
}

export type ViewState = "intro" | "ready" | "saved" | "quiz" | "result";

/** De varige profil-feltene kanalveilederen trenger for å bygge en forespørsel. */
export interface ChannelGuideProfile {
  industryId: string | null;
  industryName: string | null;
  audienceType: "b2b" | "b2c" | "both" | null;
  mainGoal: "leads" | "sales" | "awareness" | "recruitment" | null;
  weeklyTime: "1-2h" | "3-5h" | "5h+" | null;
  strengths: "writing" | "speaking" | "visual" | "mixed" | null;
}

export interface ChannelGuideClientProps {
  initialSavedResult: SavedResult | null;
  industries: Industry[];
  profile: ChannelGuideProfile;
}
