import type { TimeOfDay } from "./taxonomy";
import type { Experience, PlanItem, Trip } from "./types";

export interface MoveTarget {
  dayIndex: number | null;
  slot: TimeOfDay;
  /** Position within the target slot; defaults to the end. */
  order?: number;
}

const sameBucket = (a: Pick<PlanItem, "dayIndex" | "slot">, b: Pick<PlanItem, "dayIndex" | "slot">) =>
  a.dayIndex === b.dayIndex && a.slot === b.slot;

/**
 * Move one item anywhere: another day, another slot, back to the shelf
 * (dayIndex null). Returns a new array with orders renumbered 0..n in both
 * the source and target buckets.
 */
export function moveItem(items: PlanItem[], itemId: string, to: MoveTarget): PlanItem[] {
  const item = items.find((i) => i.id === itemId);
  if (!item) throw new Error(`Plan item ${itemId} not found`);

  const others = items.filter((i) => i.id !== itemId);
  const target = others
    .filter((i) => sameBucket(i, to))
    .sort((a, b) => a.order - b.order);
  const position = Math.max(0, Math.min(to.order ?? target.length, target.length));
  const moved: PlanItem = { ...item, dayIndex: to.dayIndex, slot: to.slot };
  target.splice(position, 0, moved);

  const reordered = new Map<string, PlanItem>();
  target.forEach((i, order) => reordered.set(i.id, { ...i, order }));
  others
    .filter((i) => sameBucket(i, item) && !sameBucket(i, to))
    .sort((a, b) => a.order - b.order)
    .forEach((i, order) => reordered.set(i.id, { ...i, order }));

  return items.map((i) => reordered.get(i.id) ?? i);
}

export interface PlanWarning {
  itemId: string;
  kind: "time_of_day" | "heavy_then_party" | "not_arrived" | "book_ahead" | "off_season" | "overloaded_day";
  message: string;
}

const SLOT_ORDER: TimeOfDay[] = ["morning", "afternoon", "evening", "night"];
const MAX_DAY_MINUTES = 10 * 60;

function addDays(isoDate: string, days: number): Date {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/** Practical checks the planner sees as they drag things around. */
export function planWarnings(
  trip: Trip,
  items: PlanItem[],
  experiences: Map<string, Experience>,
  today: Date = new Date(),
): PlanWarning[] {
  const warnings: PlanWarning[] = [];
  const scheduled = items.filter((i): i is PlanItem & { dayIndex: number } => i.dayIndex !== null);

  for (const item of scheduled) {
    const e = experiences.get(item.experienceId);
    if (!e) continue;
    const day = addDays(trip.startDate, item.dayIndex);

    if (!e.bestTime.includes(item.slot)) {
      warnings.push({ itemId: item.id, kind: "time_of_day", message: `${e.name} is best in the ${e.bestTime.join(" or ")}` });
    }

    const daysUntil = Math.floor((day.getTime() - today.getTime()) / 86_400_000);
    if (e.bookingLeadDays > 0 && daysUntil < e.bookingLeadDays) {
      warnings.push({ itemId: item.id, kind: "book_ahead", message: `${e.name} needs booking ${e.bookingLeadDays} days ahead` });
    }

    if (e.avoidMonths?.includes(day.getUTCMonth() + 1)) {
      warnings.push({ itemId: item.id, kind: "off_season", message: `${e.name} is off-season that month` });
    }

    const attendees = item.attendeeIds.length
      ? trip.travelers.filter((t) => item.attendeeIds.includes(t.id))
      : trip.travelers;
    const dayEnd = addDays(trip.startDate, item.dayIndex + 1);
    const notHere = attendees.filter((t) => t.arrival && new Date(t.arrival) >= dayEnd);
    if (notHere.length) {
      warnings.push({ itemId: item.id, kind: "not_arrived", message: `${notHere.map((t) => t.name).join(" & ")} won't have landed yet` });
    }
  }

  const byDay = Map.groupBy(scheduled, (i) => i.dayIndex);
  for (const dayItems of byDay.values()) {
    const sorted = [...dayItems].sort(
      (a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot) || a.order - b.order,
    );
    const heavyAt = sorted.findIndex((i) => experiences.get(i.experienceId)?.emotionalWeight === "heavy");
    if (heavyAt >= 0) {
      for (const later of sorted.slice(heavyAt + 1)) {
        const e = experiences.get(later.experienceId);
        if (e?.kind === "nightlife" || e?.energy === "high") {
          warnings.push({
            itemId: later.id,
            kind: "heavy_then_party",
            message: `${e.name} lands right after ${experiences.get(sorted[heavyAt].experienceId)?.name}. Consider a slower night.`,
          });
        }
      }
    }

    const minutes = sorted.reduce((sum, i) => sum + (experiences.get(i.experienceId)?.durationMinutes ?? 0), 0);
    if (minutes > MAX_DAY_MINUTES) {
      warnings.push({
        itemId: sorted[sorted.length - 1].id,
        kind: "overloaded_day",
        message: `Day ${sorted[0].dayIndex + 1} has ${Math.round(minutes / 60)}h of plans`,
      });
    }
  }

  return warnings;
}
