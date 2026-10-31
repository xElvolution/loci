import { describe, expect, it } from "vitest";
import { activeOn, adherence, checkinStreak, dosesFor, earnedBadges } from "@/lib/care/schedule";
import { addDays, dayNumber, diffDays, prettyTime, todayIn, weekdayOf } from "@/lib/care/dates";
import type { PlanItem } from "@/lib/care/types";

const item = (over: Partial<PlanItem>): PlanItem => ({ id: "i1", kind: "medication", title: "Tablet", detail: "", times: ["08:00", "20:00"], weekdays: null, start_day: 0, end_day: null, day: null, at_time: null, location: "", sort: 0, reached_at: null, ...over });

describe("dates", () => {
  it("adds and diffs calendar days across month ends", () => {
    expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
    expect(diffDays("2026-11-02", "2026-10-30")).toBe(3);
    expect(dayNumber("2026-10-21", "2026-10-30")).toBe(9);
    expect(weekdayOf("2026-10-30")).toBe(5);
  });
  it("formats times for people", () => {
    expect(prettyTime("08:00")).toBe("8 am");
    expect(prettyTime("14:30")).toBe("2:30 pm");
    expect(prettyTime("00:00")).toBe("12 am");
  });
  it("computes today in a time zone", () => {
    const t = new Date("2026-10-30T23:30:00Z");
    expect(todayIn("UTC", t)).toBe("2026-10-30");
    expect(todayIn("Asia/Tokyo", t)).toBe("2026-10-31");
    expect(todayIn("America/New_York", t)).toBe("2026-10-30");
  });
});

describe("schedule", () => {
  it("respects start and end days and weekdays", () => {
    const it1 = item({ start_day: 2, end_day: 4 });
    expect(activeOn(it1, "2026-10-20", "2026-10-21")).toBe(false);
    expect(activeOn(it1, "2026-10-20", "2026-10-22")).toBe(true);
    expect(activeOn(it1, "2026-10-20", "2026-10-25")).toBe(false);
    const fri = item({ weekdays: [5] });
    expect(activeOn(fri, "2026-10-20", "2026-10-30")).toBe(true);
    expect(activeOn(fri, "2026-10-20", "2026-10-29")).toBe(false);
  });
  it("lists slots in time order and marks done ones", () => {
    const doses = dosesFor([item({}), item({ id: "i2", kind: "care", times: [] })], "2026-10-20", "2026-10-30", [{ item_id: "i1", for_date: "2026-10-30", slot: "20:00" }]);
    expect(doses.map((d) => `${d.item.id}@${d.slot}:${d.done}`)).toEqual(["i1@08:00:false", "i1@20:00:true", "i2@any:false"]);
  });
  it("never schedules appointments or milestones as tasks", () => {
    expect(dosesFor([item({ kind: "appointment" }), item({ kind: "milestone" })], "2026-10-20", "2026-10-30", [])).toEqual([]);
  });
  it("computes adherence across days", () => {
    const a = adherence([item({})], "2026-10-28", ["2026-10-29", "2026-10-30"], [
      { item_id: "i1", for_date: "2026-10-29", slot: "08:00" },
      { item_id: "i1", for_date: "2026-10-29", slot: "20:00" },
      { item_id: "i1", for_date: "2026-10-30", slot: "08:00" },
    ]);
    expect(a).toEqual({ scheduled: 4, done: 3, rate: 0.75 });
  });
  it("keeps a streak alive until the end of today", () => {
    const s = checkinStreak(["2026-10-27", "2026-10-28", "2026-10-29"], "2026-10-30");
    expect(s).toEqual({ current: 3, best: 3, doneToday: false });
    expect(checkinStreak(["2026-10-25", "2026-10-26", "2026-10-30"], "2026-10-30")).toEqual({ current: 1, best: 2, doneToday: true });
  });
  it("earns badges from showing up only", () => {
    expect(earnedBadges(1, 1).filter((b) => b.earned).map((b) => b.id)).toEqual(["first"]);
    expect(earnedBadges(9, 7).filter((b) => b.earned).map((b) => b.id)).toEqual(["first", "three", "week"]);
  });
});
