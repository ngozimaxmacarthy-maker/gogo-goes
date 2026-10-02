import { ghanaExperiences } from "@/data/seed-ghana";
import { recommend } from "@/lib/recommend";
import { INTEREST_GROUPS } from "@/lib/taxonomy";
import type { Trip } from "@/lib/types";

// Demo group until trips live in the database.
const demoTrip: Trip = {
  id: "demo",
  name: "Demo honeymoon",
  occasion: "honeymoon",
  country: "GH",
  startDate: "2027-02-10",
  endDate: "2027-02-20",
  baseCurrency: "USD",
  status: "planning",
  modules: ["itinerary", "payments", "flights"],
  travelers: [
    { id: "a", name: "Traveler A", adventurousness: 4, interests: { hiking_trails: 3, art_design: 2, crafts_makers: 2 } },
    { id: "b", name: "Traveler B", adventurousness: 3, interests: { live_music: 3, hiking_trails: 2, village_life: 2 } },
  ],
};

export default function Home() {
  const picks = recommend(demoTrip, ghanaExperiences, { limit: 6 });

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 space-y-12">
      <header className="space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight">Gogo Goes</h1>
        <p className="text-[var(--muted)]">
          Plan together, lock it in, then travel with a live trip dashboard. Built for the road less traveled.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Top picks for a demo honeymoon in Ghana</h2>
        <ol className="space-y-3">
          {picks.map(({ experience, score, reasons }) => (
            <li key={experience.id} className="rounded-xl border border-black/10 p-4 dark:border-white/10">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-medium">{experience.name}</span>
                <span className="text-sm tabular-nums text-[var(--muted)]">{Math.round(score * 100)}% match</span>
              </div>
              <p className="text-sm text-[var(--muted)]">{experience.city} · {reasons.join(" · ")}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">What travelers rate</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {INTEREST_GROUPS.map((group) => (
            <div key={group.key}>
              <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">{group.label}</h3>
              <ul className="text-sm">
                {group.interests.map((i) => (
                  <li key={i.key}>{i.emoji} {i.label}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
