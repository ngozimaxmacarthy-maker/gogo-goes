import { describe, expect, it } from "vitest";
import { ghanaExperiences } from "@/data/seed-ghana";
import { groupFitFor, recommend, travelerAffinity } from "@/lib/recommend";
import type { Experience } from "@/lib/types";
import { honeymoon } from "./fixtures";

const byId = (id: string) => ghanaExperiences.find((e) => e.id === id)!;

describe("recommend", () => {
  it("ranks shared loves above one person's favorite", () => {
    const ranked = recommend(honeymoon, ghanaExperiences).map((r) => r.experience.id);
    expect(ranked.indexOf("gh-kakum-canopy")).toBeLessThan(ranked.indexOf("gh-republic-bar"));
  });

  it("ignores AI-suggested tags until approved", () => {
    const onlySuggested: Experience = {
      ...byId("gh-nubuke"),
      id: "x",
      tags: byId("gh-nubuke").tags.filter((t) => t.status === "suggested"),
    };
    expect(recommend(honeymoon, [onlySuggested])).toEqual([]);
  });

  it("applies the honeymoon occasion boost", () => {
    const romantic: Experience = {
      ...byId("gh-nubuke"),
      tags: [{ interest: "romance", strength: 3, status: "approved", source: "curator", confidence: null }],
    };
    const ananya = honeymoon.travelers[0];
    expect(travelerAffinity(ananya, romantic, { occasion: "honeymoon" })).toBeGreaterThan(
      travelerAffinity(ananya, romantic, { occasion: "friends_trip" }),
    );
  });

  it("penalizes off-season experiences", () => {
    const june = { ...honeymoon, startDate: "2027-06-05" };
    const wli = byId("gh-wli-falls");
    const [inSeason] = recommend(honeymoon, [wli]);
    const [offSeason] = recommend(june, [wli]);
    expect(offSeason.score).toBeLessThan(inSeason.score);
    expect(offSeason.reasons).toContain("Off-season when you're traveling");
  });

  it("maps group size to fit", () => {
    expect(groupFitFor(2)).toBe("couple");
    expect(groupFitFor(4)).toBe("small_group");
  });
});
