import type { Trip } from "@/lib/types";

export const honeymoon: Trip = {
  id: "trip-honeymoon",
  name: "Ananya & Tyler",
  occasion: "honeymoon",
  country: "GH",
  startDate: "2027-02-10",
  endDate: "2027-02-20",
  baseCurrency: "USD",
  status: "planning",
  modules: ["itinerary", "payments", "flights"],
  travelers: [
    { id: "ananya", name: "Ananya", adventurousness: 4, interests: { hiking_trails: 3, art_design: 2, nightlife: 0 } },
    { id: "tyler", name: "Tyler", adventurousness: 3, interests: { hiking_trails: 2, live_music: 3, nightlife: 1 } },
  ],
};
