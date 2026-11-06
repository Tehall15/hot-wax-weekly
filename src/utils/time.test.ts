import { describe, expect, it } from "vitest";
import { getWeekKey, shiftWeekKey } from "./time";

describe("week keys", () => {
  it("uses the previous Monday on Sunday", () => {
    expect(getWeekKey(new Date(2026, 10, 8, 12))).toBe("2026-11-02");
    expect(getWeekKey(new Date(2026, 10, 9, 12))).toBe("2026-11-09");
  });

  it("shifts across year and daylight-saving boundaries", () => {
    expect(shiftWeekKey("2026-12-28", 7)).toBe("2027-01-04");
    expect(shiftWeekKey("2026-03-02", 7)).toBe("2026-03-09");
  });
});
