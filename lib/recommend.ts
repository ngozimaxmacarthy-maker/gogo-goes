import { INTERESTS, OCCASION_BOOSTS, OFFBEAT_LEVELS, type GroupFit, type InterestKey } from "./taxonomy";
import type { Experience, Traveler, Trip } from "./types";

export interface Recommendation {
  experience: Experience;
  /** 0–1. */
  score: number;
  perTraveler: Record<string, number>;
  reasons: string[];
}

const INTEREST_LABEL = new Map(INTERESTS.map((i) => [i.key, i.label]));

/**
 * Least-misery blend: a group plan shouldn't include something one person
 * actively dreads just because everyone else loves it.
 */
const MEAN_WEIGHT = 0.6;
const MIN_WEIGHT = 0.4;
const OFFBEAT_WEIGHT = 0.15;

export function groupFitFor(size: number): GroupFit {
  if (size <= 1) return "solo";
  if (size === 2) return "couple";
  if (size <= 6) return "small_group";
  return "large_group";
}

function approvedTags(e: Experience) {
  return e.tags.filter((t) => t.status === "approved");
}

/** How much one traveler would enjoy an experience, 0–1. */
export function travelerAffinity(t: Traveler, e: Experience, trip: Pick<Trip, "occasion">): number {
  const tags = approvedTags(e);
  if (tags.length === 0) return 0;

  const boosts = OCCASION_BOOSTS[trip.occasion];
  let weighted = 0;
  let totalStrength = 0;
  for (const tag of tags) {
    const level = Math.min(3, (t.interests[tag.interest] ?? 0) + (boosts[tag.interest] ?? 0));
    weighted += (level / 3) * tag.strength;
    totalStrength += tag.strength;
  }
  const interestFit = weighted / totalStrength;
  const offbeatFit = 1 - Math.abs(e.offbeat - t.adventurousness) / 4;
  return (1 - OFFBEAT_WEIGHT) * interestFit + OFFBEAT_WEIGHT * offbeatFit;
}

export function recommend(
  trip: Trip,
  experiences: Experience[],
  opts: { limit?: number; travelerIds?: string[] } = {},
): Recommendation[] {
  const travelers = opts.travelerIds
    ? trip.travelers.filter((t) => opts.travelerIds!.includes(t.id))
    : trip.travelers;
  if (travelers.length === 0) return [];

  const month = Number(trip.startDate.slice(5, 7));
  const fit = groupFitFor(travelers.length);
  const budgets = travelers.map((t) => t.dailyBudgetUsd).filter((b): b is number => b != null);
  const tightestBudget = budgets.length ? Math.min(...budgets) : null;

  const results = experiences
    .filter((e) => e.country === trip.country && approvedTags(e).length > 0)
    .map((e) => {
      const perTraveler: Record<string, number> = {};
      for (const t of travelers) perTraveler[t.id] = travelerAffinity(t, e, trip);
      const values = Object.values(perTraveler);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      let score = MEAN_WEIGHT * mean + MIN_WEIGHT * Math.min(...values);

      const reasons: string[] = [];
      if (e.avoidMonths?.includes(month)) {
        score *= 0.5;
        reasons.push("Off-season when you're traveling");
      }
      if (!e.groupFit.includes(fit)) {
        score *= 0.8;
        reasons.push(`Not ideal for a ${fit.replace("_", " ")}`);
      }
      if (tightestBudget != null && e.costUsd > tightestBudget * 0.5) {
        score *= 0.7;
        reasons.push("Pricey for the group's budget");
      }

      reasons.unshift(...positiveReasons(e, travelers));
      return { experience: e, score, perTraveler, reasons };
    });

  results.sort((a, b) => b.score - a.score);
  return opts.limit ? results.slice(0, opts.limit) : results;
}

function positiveReasons(e: Experience, travelers: Traveler[]): string[] {
  const reasons: string[] = [];
  const top = [...approvedTags(e)].sort((a, b) => b.strength - a.strength)[0];
  if (top) {
    const fans = travelers.filter((t) => (t.interests[top.interest as InterestKey] ?? 0) >= 2);
    if (fans.length === travelers.length && travelers.length > 1) {
      reasons.push(`Everyone's into ${INTEREST_LABEL.get(top.interest)?.toLowerCase()}`);
    } else if (fans.length > 0) {
      reasons.push(`${fans.map((f) => f.name).join(" & ")} love ${INTEREST_LABEL.get(top.interest)?.toLowerCase()}`);
    }
  }
  if (e.offbeat >= 4) reasons.push(OFFBEAT_LEVELS[e.offbeat]);
  if (e.ownership === "community_owned") reasons.push("Community-owned");
  return reasons;
}
