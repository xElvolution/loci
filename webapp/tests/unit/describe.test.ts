import { describe, expect, it } from "vitest";
import { howSteps } from "@/lib/care/describe";

describe("howSteps", () => {
  it("keeps lines as steps and strips bullets", () => {
    expect(howSteps("1. Wash hands\n- Peel the pad\n• Press for 10 seconds")).toEqual(["Wash hands", "Peel the pad", "Press for 10 seconds"]);
  });
  it("splits sentences without changing words", () => {
    expect(howSteps("Take it with food. Drink water! Call us if unsure")).toEqual(["Take it with food.", "Drink water!", "Call us if unsure"]);
  });
  it("is empty for empty text", () => {
    expect(howSteps("  ")).toEqual([]);
    expect(howSteps(undefined)).toEqual([]);
  });
});
