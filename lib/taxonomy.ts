// The Gogo Goes tag taxonomy.
//
// Interests are what travelers rate in the survey (0–3) and what experiences
// are tagged with. Everything else is a descriptive dimension the planner and
// the recommender use, but travelers never rate directly.
//
// Built for the road less traveled: places where the best experience is a
// person, not a listing — a tailor, a drummer, a fisherman's co-op.

export const INTEREST_GROUPS = [
  {
    key: "food",
    label: "Food & drink",
    interests: [
      { key: "street_food", label: "Street food & chop bars", emoji: "🍢" },
      { key: "markets", label: "Markets & bargaining", emoji: "🧺" },
      { key: "new_wave_dining", label: "Chef-driven local dining", emoji: "🍽️" },
      { key: "cooking_hands_on", label: "Cooking classes & farm visits", emoji: "👩🏾‍🍳" },
      { key: "drinks_scene", label: "Rooftops, palm wine & cocktails", emoji: "🍹" },
    ],
  },
  {
    key: "culture",
    label: "Culture & history",
    interests: [
      { key: "history_heritage", label: "History & heritage sites", emoji: "🏛️" },
      { key: "diaspora_roots", label: "Diaspora & roots journeys", emoji: "🌍" },
      { key: "spiritual_sacred", label: "Sacred sites & spiritual practice", emoji: "🕯️" },
      { key: "festivals_ceremonies", label: "Festivals & ceremonies", emoji: "🎉" },
      { key: "village_life", label: "Village life & homestays", emoji: "🛖" },
    ],
  },
  {
    key: "creative",
    label: "Art, music & making",
    interests: [
      { key: "art_design", label: "Galleries, art & design", emoji: "🎨" },
      { key: "live_music", label: "Live music & dance", emoji: "🥁" },
      { key: "crafts_makers", label: "Artisans & craft workshops", emoji: "🧵" },
      { key: "fashion_tailoring", label: "Fabric, tailoring & custom fits", emoji: "👗" },
      { key: "architecture_urban", label: "Architecture & city walks", emoji: "🏙️" },
    ],
  },
  {
    key: "outdoors",
    label: "Nature & adventure",
    interests: [
      { key: "beaches_islands", label: "Beaches & islands", emoji: "🏝️" },
      { key: "hiking_trails", label: "Hikes, waterfalls & viewpoints", emoji: "🥾" },
      { key: "wildlife", label: "Wildlife & birding", emoji: "🐘" },
      { key: "water_adventure", label: "Surf, kayak & dive", emoji: "🌊" },
      { key: "off_grid", label: "Remote & off-grid escapes", emoji: "🧭" },
    ],
  },
  {
    key: "pace",
    label: "Nights & downtime",
    interests: [
      { key: "nightlife", label: "Clubs & late nights", emoji: "🪩" },
      { key: "wellness", label: "Spa, braids & slow mornings", emoji: "💆🏾‍♀️" },
      { key: "romance", label: "Romantic moments", emoji: "💞" },
      { key: "luxury_stays", label: "Design hotels & splurges", emoji: "✨" },
      { key: "photo_spots", label: "Scenic & photo-worthy", emoji: "📸" },
    ],
  },
] as const;

export type InterestKey =
  (typeof INTEREST_GROUPS)[number]["interests"][number]["key"];

export const INTERESTS = INTEREST_GROUPS.flatMap((g) =>
  g.interests.map((i) => ({ ...i, group: g.key })),
);

export const INTEREST_KEYS = INTERESTS.map((i) => i.key) as InterestKey[];

/** Survey scale, kept from the travel MVP. */
export const INTEREST_LEVELS = [
  { value: 0, label: "Not for me" },
  { value: 1, label: "Maybe" },
  { value: 2, label: "Into it" },
  { value: 3, label: "Must do" },
] as const;

export type InterestLevel = (typeof INTEREST_LEVELS)[number]["value"];

// --- Descriptive dimensions (curator-approved, not survey-rated) -----------

/** 1 = on every list, 5 = you need a local to find it. The niche lives at 3–5. */
export const OFFBEAT_LEVELS = {
  1: "Classic must-see",
  2: "Well known",
  3: "Locals' favorite",
  4: "Hidden gem",
  5: "Off the map",
} as const;
export type OffbeatLevel = keyof typeof OFFBEAT_LEVELS;

export const ENERGY = ["chill", "moderate", "high"] as const;
export type Energy = (typeof ENERGY)[number];

/**
 * Heavy experiences (slave castles, memorials) shouldn't be followed by a
 * party on the same day. The planner warns on that.
 */
export const EMOTIONAL_WEIGHT = ["light", "moderate", "heavy"] as const;
export type EmotionalWeight = (typeof EMOTIONAL_WEIGHT)[number];

export const PHYSICAL_INTENSITY = ["easy", "active", "strenuous"] as const;
export type PhysicalIntensity = (typeof PHYSICAL_INTENSITY)[number];

export const GROUP_FIT = ["solo", "couple", "small_group", "large_group"] as const;
export type GroupFit = (typeof GROUP_FIT)[number];

export const TIME_OF_DAY = ["morning", "afternoon", "evening", "night"] as const;
export type TimeOfDay = (typeof TIME_OF_DAY)[number];

/** Practical realities in developing-country travel that change the plan. */
export const LOGISTICS_FLAGS = [
  "cash_only",
  "mobile_money",
  "needs_driver",
  "needs_guide",
  "low_connectivity",
  "rainy_season_risk",
  "modest_dress",
  "photo_restrictions",
  "advance_booking",
] as const;
export type LogisticsFlag = (typeof LOGISTICS_FLAGS)[number];

/** Who the money goes to. A first-class signal for responsible travel. */
export const OWNERSHIP = ["community_owned", "locally_owned", "international"] as const;
export type Ownership = (typeof OWNERSHIP)[number];

export const OCCASIONS = [
  "honeymoon",
  "friends_trip",
  "birthday",
  "family",
  "solo",
  "roots_journey",
] as const;
export type Occasion = (typeof OCCASIONS)[number];

/** Occasion nudges — e.g. a honeymoon leans romance, couple-fit and chill. */
export const OCCASION_BOOSTS: Record<Occasion, Partial<Record<InterestKey, number>>> = {
  honeymoon: { romance: 1.5, luxury_stays: 0.5, wellness: 0.5, beaches_islands: 0.5 },
  friends_trip: { nightlife: 0.5, live_music: 0.5, drinks_scene: 0.5 },
  birthday: { new_wave_dining: 0.5, drinks_scene: 0.5 },
  family: { wildlife: 0.5, beaches_islands: 0.5 },
  solo: { village_life: 0.5, crafts_makers: 0.5 },
  roots_journey: { diaspora_roots: 1.5, history_heritage: 0.5, festivals_ceremonies: 0.5 },
};

/** Migration from the travel MVP's 7 vibes. */
export const LEGACY_VIBE_MAP: Record<string, InterestKey[]> = {
  resorts_beaches: ["beaches_islands", "luxury_stays"],
  nightlife: ["nightlife", "drinks_scene"],
  art_galleries: ["art_design"],
  historical: ["history_heritage", "diaspora_roots"],
  local_food: ["street_food", "new_wave_dining", "markets"],
  nature: ["hiking_trails", "off_grid"],
  animals: ["wildlife"],
};
