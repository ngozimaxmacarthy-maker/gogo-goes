import type {
  EmotionalWeight,
  Energy,
  GroupFit,
  InterestKey,
  InterestLevel,
  LogisticsFlag,
  Occasion,
  OffbeatLevel,
  Ownership,
  PhysicalIntensity,
  TimeOfDay,
} from "./taxonomy";

/** A tag only counts toward recommendations once a curator approves it. */
export type TagStatus = "suggested" | "approved" | "rejected";

export interface ExperienceTag {
  interest: InterestKey;
  /** 1 = touches on it, 3 = it's the whole point. */
  strength: 1 | 2 | 3;
  status: TagStatus;
  source: "ai" | "curator";
  /** AI confidence 0–1; null for curator-added tags. */
  confidence: number | null;
}

/**
 * The shared unit both modes run on. Plan mode recommends and schedules
 * Experiences; Trip mode shows their logistics and costs.
 */
export interface Experience {
  id: string;
  name: string;
  kind: "activity" | "food" | "nightlife" | "stay" | "transport";
  country: string; // ISO 3166-1 alpha-2, e.g. "GH"
  city: string;
  neighborhood?: string;
  description: string;
  insiderTip?: string;

  tags: ExperienceTag[];
  offbeat: OffbeatLevel;
  energy: Energy;
  emotionalWeight: EmotionalWeight;
  physicalIntensity: PhysicalIntensity;
  groupFit: GroupFit[];
  bestTime: TimeOfDay[];
  durationMinutes: number;
  /** Per person, in USD for ranking; local price lives in notes. */
  costUsd: number;
  bookingLeadDays: number;
  logistics: LogisticsFlag[];
  ownership?: Ownership;
  /** Months (1–12) to avoid, e.g. rainy season. */
  avoidMonths?: number[];
  dressCode?: string;

  source: "curator" | "viator" | "booking" | "import";
  externalId?: string;
  url?: string;
}

export type InterestProfile = Partial<Record<InterestKey, InterestLevel>>;

export interface Traveler {
  id: string;
  name: string;
  interests: InterestProfile;
  /** 1–5: how far off the beaten path they want to go. */
  adventurousness: 1 | 2 | 3 | 4 | 5;
  dailyBudgetUsd?: number;
  arrival?: string; // ISO datetime
  departure?: string;
}

export const MODULE_KEYS = [
  "itinerary",
  "payments",
  "flights",
  "logistics",
  "packing",
  "outfits",
  "journal",
] as const;
export type ModuleKey = (typeof MODULE_KEYS)[number];

export type TripStatus = "planning" | "locked" | "live" | "done";

export interface Trip {
  id: string;
  name: string;
  occasion: Occasion;
  country: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  baseCurrency: string; // ISO 4217
  status: TripStatus;
  modules: ModuleKey[];
  travelers: Traveler[];
}

/**
 * One experience placed on the plan. dayIndex null means it's on the shelf:
 * shortlisted but not scheduled. Moving things around is just changing
 * dayIndex/slot/order.
 */
export interface PlanItem {
  id: string;
  tripId: string;
  experienceId: string;
  dayIndex: number | null;
  slot: TimeOfDay;
  order: number;
  /** Subset of travelers going; empty means everyone. */
  attendeeIds: string[];
}

export interface Expense {
  id: string;
  tripId: string;
  description: string;
  amount: number;
  currency: string;
  /** Multiply by this to get baseCurrency. */
  fxToBase: number;
  paidById: string;
  /** Traveler id → share weight. Equal weights = even split. */
  shares: Record<string, number>;
  planItemId?: string;
}

/** Everything the algorithm learns from. Append-only. */
export type ExperienceEventType =
  | "recommended"
  | "shortlisted"
  | "scheduled"
  | "removed"
  | "attended"
  | "skipped"
  | "rated";

export interface ExperienceEvent {
  travelerId: string;
  tripId: string;
  experienceId: string;
  type: ExperienceEventType;
  /** For "rated": 1–5. */
  value?: number;
  at: string;
}
