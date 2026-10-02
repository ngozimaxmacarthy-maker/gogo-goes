import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { InterestProfile } from "@/lib/types";

export const tagStatus = pgEnum("tag_status", ["suggested", "approved", "rejected"]);
export const tripStatus = pgEnum("trip_status", ["planning", "locked", "live", "done"]);
export const eventType = pgEnum("experience_event_type", [
  "recommended",
  "shortlisted",
  "scheduled",
  "removed",
  "attended",
  "skipped",
  "rated",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  isCurator: boolean("is_curator").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const experiences = pgTable(
  "experiences",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    kind: text("kind").notNull(),
    country: text("country").notNull(),
    city: text("city").notNull(),
    neighborhood: text("neighborhood"),
    description: text("description").notNull(),
    insiderTip: text("insider_tip"),
    offbeat: smallint("offbeat").notNull(),
    energy: text("energy").notNull(),
    emotionalWeight: text("emotional_weight").notNull(),
    physicalIntensity: text("physical_intensity").notNull(),
    groupFit: text("group_fit").array().notNull(),
    bestTime: text("best_time").array().notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    costUsd: numeric("cost_usd", { precision: 10, scale: 2 }).notNull(),
    bookingLeadDays: integer("booking_lead_days").notNull().default(0),
    logistics: text("logistics").array().notNull().default([]),
    ownership: text("ownership"),
    avoidMonths: smallint("avoid_months").array(),
    dressCode: text("dress_code"),
    source: text("source").notNull(),
    externalId: text("external_id"),
    url: text("url"),
    /** Unpublished until a curator has reviewed its tags. */
    published: boolean("published").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("experiences_country_city_idx").on(t.country, t.city)],
);

/** AI-suggested tags land here as "suggested" and wait for curator review. */
export const experienceTags = pgTable(
  "experience_tags",
  {
    experienceId: text("experience_id")
      .notNull()
      .references(() => experiences.id, { onDelete: "cascade" }),
    interest: text("interest").notNull(),
    strength: smallint("strength").notNull(),
    status: tagStatus("status").notNull().default("suggested"),
    source: text("source").notNull(),
    confidence: real("confidence"),
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (t) => [
    primaryKey({ columns: [t.experienceId, t.interest] }),
    index("experience_tags_status_idx").on(t.status),
  ],
);

export const trips = pgTable("trips", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  occasion: text("occasion").notNull(),
  country: text("country").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  baseCurrency: text("base_currency").notNull().default("USD"),
  status: tripStatus("status").notNull().default("planning"),
  modules: text("modules").array().notNull().default(["itinerary", "payments"]),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** A traveler on a trip. Each one takes the survey. */
export const tripMembers = pgTable(
  "trip_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id),
    name: text("name").notNull(),
    role: text("role").notNull().default("traveler"), // "planner" | "traveler"
    interests: jsonb("interests").$type<InterestProfile>().notNull().default({}),
    adventurousness: smallint("adventurousness").notNull().default(3),
    dailyBudgetUsd: numeric("daily_budget_usd", { precision: 10, scale: 2 }),
    surveyCompletedAt: timestamp("survey_completed_at", { withTimezone: true }),
  },
  (t) => [index("trip_members_trip_idx").on(t.tripId)],
);

export const flights = pgTable("flights", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  memberId: uuid("member_id")
    .notNull()
    .references(() => tripMembers.id, { onDelete: "cascade" }),
  flightNumber: text("flight_number").notNull(),
  direction: text("direction").notNull(), // "arrival" | "departure"
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  /** Filled in by the flight-tracking job. */
  liveStatus: text("live_status"),
  estimatedAt: timestamp("estimated_at", { withTimezone: true }),
});

export const planItems = pgTable(
  "plan_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    experienceId: text("experience_id")
      .notNull()
      .references(() => experiences.id),
    dayIndex: integer("day_index"), // null = on the shelf
    slot: text("slot").notNull(),
    order: integer("order").notNull().default(0),
    attendeeIds: uuid("attendee_ids").array().notNull().default([]),
  },
  (t) => [index("plan_items_trip_day_idx").on(t.tripId, t.dayIndex)],
);

export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull(),
  fxToBase: numeric("fx_to_base", { precision: 14, scale: 6 }).notNull().default("1"),
  paidById: uuid("paid_by_id")
    .notNull()
    .references(() => tripMembers.id),
  shares: jsonb("shares").$type<Record<string, number>>().notNull(),
  planItemId: uuid("plan_item_id").references(() => planItems.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Append-only training signal for the recommender. */
export const experienceEvents = pgTable(
  "experience_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memberId: uuid("member_id")
      .notNull()
      .references(() => tripMembers.id, { onDelete: "cascade" }),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    experienceId: text("experience_id")
      .notNull()
      .references(() => experiences.id),
    type: eventType("type").notNull(),
    value: smallint("value"),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("experience_events_experience_idx").on(t.experienceId, t.type)],
);
