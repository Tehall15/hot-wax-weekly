import { describe, expect, it } from "vitest";
import { buildSlotsFromReviews } from "./slots";
import type { Review } from "../types";

describe("buildSlotsFromReviews", () => {
  it("only fills slots from the selected week", () => {
    const review: Review = {
      id: "1",
      weekKey: "2026-11-02",
      type: "contemporary",
      artist: "Artist",
      album: "Album",
      rating: 8,
      topTracks: [],
      notes: "",
      reviewedAt: "2026-11-03T12:00:00Z",
    };
    expect(buildSlotsFromReviews([review], "2026-11-02")[0].album?.album).toBe("Album");
    expect(buildSlotsFromReviews([review], "2026-11-09")[0].album).toBeNull();
  });
});
