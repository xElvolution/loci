import { EMPTY_DRAFT, isComplete, toInput, toggleSign } from "@/lib/checkin";
import { becauseLine, firstName, greeting, howSteps, prettyDate, prettyTime, relativeTime, telHref } from "@/lib/format";
import { composeGoodDay } from "@/lib/goodday";
import { roadStops } from "@/lib/journey";
import { DEFAULT_PREFS, parsePrefs } from "@/lib/prefs";
import type { TodayItem } from "@/lib/api/types";

describe("format", () => {
  it("formats times and dates", () => {
    expect(prettyTime("08:00")).toBe("8 am");
    expect(prettyTime("13:30")).toBe("1:30 pm");
    expect(prettyTime("00:15")).toBe("12:15 am");
    expect(prettyTime("any")).toBe("Any time");
    expect(prettyDate("2026-10-31")).toBe("Sat 31 Oct");
    expect(greeting(8)).toBe("Good morning");
    expect(greeting(20)).toBe("Good evening");
    expect(firstName("Daniel Okafor")).toBe("Daniel");
    expect(firstName("")).toBe("there");
  });
  it("explains a Qloo pick by the favorites it came from", () => {
    expect(becauseLine(["Bruce Springsteen", "Ted Lasso"])).toBe("Because of Bruce Springsteen and Ted Lasso");
    expect(becauseLine([])).toBeNull();
    expect(becauseLine(null)).toBeNull();
  });
  it("builds tel links with only digits and plus", () => {
    expect(telHref("+1 (555) 010-2030")).toBe("tel:+15550102030");
  });
  it("splits how-to text into steps", () => {
    expect(howSteps("1. Sit up\n- Breathe in\n\n• Hold")).toEqual(["Sit up", "Breathe in", "Hold"]);
    expect(howSteps(["a", " b "])).toEqual(["a", "b"]);
    expect(howSteps(null)).toEqual([]);
  });
  it("describes relative time", () => {
    const now = new Date("2026-10-31T12:00:00Z");
    expect(relativeTime("2026-10-31T11:59:30Z", now)).toBe("just now");
    expect(relativeTime("2026-10-31T11:00:00Z", now)).toBe("1 h ago");
    expect(relativeTime("2026-10-30T11:00:00Z", now)).toBe("yesterday");
  });
});

describe("check-in draft", () => {
  it("needs every answer, pain may be zero", () => {
    expect(isComplete(EMPTY_DRAFT)).toBe(false);
    const d = { ...EMPTY_DRAFT, mood: 3, pain: 0, sleep: 4, appetite: 2, energy: 5 };
    expect(isComplete(d)).toBe(true);
    expect(() => toInput(EMPTY_DRAFT)).toThrow();
  });
  it("toggles signs and trims the note", () => {
    let d = { ...EMPTY_DRAFT, mood: 3, pain: 7, sleep: 4, appetite: 2, energy: 5, note: `  ${"x".repeat(700)} ` };
    d = toggleSign(toggleSign(toggleSign(d, "a"), "b"), "a");
    const input = toInput(d);
    expect(input.signs).toEqual(["b"]);
    expect(input.note.length).toBe(600);
  });
});

describe("good-day plan", () => {
  const item = (slot: string, title: string): TodayItem => ({ item_id: title, slot, kind: "medication", title, detail: "", why: "", how: [], done: false });
  it("keeps plan lines at the team's times and adds comfort around them", () => {
    const day = composeGoodDay({
      date: "2026-10-31",
      personName: "Daniel",
      items: [item("08:00", "Tablet A"), item("08:00", "Tablet B"), item("20:00", "Tablet C")],
      comfort: { soundtrack: [{ id: "s1", name: "Nina Simone", kind: "artist", image: null, subtitle: null, because: null }], screen: [{ id: "f1", name: "Paddington", kind: "movie", image: null, subtitle: null, because: null }] },
      checkinDone: false,
    });
    expect(day[0]).toMatchObject({ source: "plan", title: "Tablet A, Tablet B", time: "8 am" });
    expect(day.map((b) => b.minutes)).toEqual([...day.map((b) => b.minutes)].sort((a, b) => a - b));
    expect(day.some((b) => b.key === "checkin")).toBe(true);
    expect(day.find((b) => b.key === "evening")?.title).toBe("Evening in with Paddington");
  });
  it("skips the check-in line once done and works with no picks", () => {
    const day = composeGoodDay({ date: "d", personName: "p", items: [], comfort: {}, checkinDone: true });
    expect(day).toEqual([]);
  });
});

describe("journey and prefs", () => {
  it("orders milestones by day after discharge", () => {
    const stops = roadStops({ day: 9, horizon_days: 42, discharge_date: "2026-10-22", streak: 1, adherence_7d: null, appointments: [], trends: [], milestones: [
      { id: "b", title: "Stairs", day: 14, reached: false },
      { id: "a", title: "Walk to the corner", day: 7, reached: true },
      { id: "c", title: "Drive again", day: null, reached: false },
    ] });
    expect(stops.map((s) => s.key)).toEqual(["home", "a", "b", "c"]);
    expect(stops[1].sub).toBe("Reached");
  });
  it("parses stored prefs defensively", () => {
    expect(parsePrefs(null)).toEqual(DEFAULT_PREFS);
    expect(parsePrefs("not json")).toEqual(DEFAULT_PREFS);
    expect(parsePrefs(JSON.stringify({ plan: false, checkinTime: "03:00" }))).toEqual({ ...DEFAULT_PREFS, plan: false });
  });
});
