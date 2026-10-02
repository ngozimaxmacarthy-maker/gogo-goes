import { describe, expect, it } from "vitest";
import { ghanaExperiences } from "@/data/seed-ghana";
import { moveItem, planWarnings } from "@/lib/plan";
import type { PlanItem } from "@/lib/types";
import { honeymoon } from "./fixtures";

const item = (id: string, experienceId: string, dayIndex: number | null, slot: PlanItem["slot"], order = 0): PlanItem => ({
  id, tripId: honeymoon.id, experienceId, dayIndex, slot, order, attendeeIds: [],
});
const catalog = new Map(ghanaExperiences.map((e) => [e.id, e]));

describe("moveItem", () => {
  it("moves between days and renumbers both buckets", () => {
    const items = [
      item("a", "gh-kakum-canopy", 0, "morning", 0),
      item("b", "gh-makola-market", 0, "morning", 1),
      item("c", "gh-nubuke", 1, "morning", 0),
    ];
    const moved = moveItem(items, "a", { dayIndex: 1, slot: "morning", order: 0 });
    const get = (id: string) => moved.find((i) => i.id === id)!;
    expect(get("a")).toMatchObject({ dayIndex: 1, order: 0 });
    expect(get("c").order).toBe(1);
    expect(get("b").order).toBe(0);
  });

  it("can send an item back to the shelf", () => {
    const moved = moveItem([item("a", "gh-nubuke", 2, "afternoon")], "a", { dayIndex: null, slot: "afternoon" });
    expect(moved[0].dayIndex).toBeNull();
  });
});

describe("planWarnings", () => {
  const today = new Date("2026-10-01T00:00:00Z");

  it("flags a party right after a heavy site", () => {
    const items = [
      item("castle", "gh-cape-coast-castle", 0, "morning"),
      item("bar", "gh-republic-bar", 0, "night"),
    ];
    const kinds = planWarnings(honeymoon, items, catalog, today).map((w) => w.kind);
    expect(kinds).toContain("heavy_then_party");
  });

  it("flags travelers who haven't landed", () => {
    const trip = {
      ...honeymoon,
      travelers: [{ ...honeymoon.travelers[0], arrival: "2027-02-11T15:00:00Z" }, honeymoon.travelers[1]],
    };
    const warnings = planWarnings(trip, [item("a", "gh-makola-market", 0, "morning")], catalog, today);
    expect(warnings.find((w) => w.kind === "not_arrived")?.message).toMatch(/Ananya/);
  });

  it("flags wrong time of day and late bookings", () => {
    const kinds = planWarnings(honeymoon, [item("a", "gh-bonwire-kente", 0, "night")], catalog, new Date("2027-02-09T00:00:00Z")).map((w) => w.kind);
    expect(kinds).toEqual(expect.arrayContaining(["time_of_day", "book_ahead"]));
  });
});
