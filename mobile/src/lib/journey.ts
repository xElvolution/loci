import type { JourneyView } from "./api/types";
import { prettyDate } from "./format";

/** Stops on the road home: discharge first, then milestones by day. */
export function roadStops(j: JourneyView) {
  const stops = j.milestones
    .slice()
    .sort((a, b) => (a.day ?? 9999) - (b.day ?? 9999))
    .map((m) => ({ key: m.id, label: m.title, sub: m.reached ? "Reached" : m.day != null ? `Around day ${m.day}` : "When you're ready", reached: m.reached }));
  return [{ key: "home", label: "Home from hospital", sub: prettyDate(j.discharge_date), reached: true }, ...stops];
}
