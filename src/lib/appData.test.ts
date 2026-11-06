import { describe, expect, it } from "vitest";
import { parseJournal } from "./appData";

describe("parseJournal", () => {
  it("hydrates a listen-later list and avatar without any reviews", () => {
    const journal = parseJournal({
      listenLater: [{ artist: "Artist", album: "Album" }],
      avatar: "🎵",
    });
    expect(journal.reviews).toEqual([]);
    expect(journal.listenLater).toHaveLength(1);
    expect(journal.avatar).toBe("🎵");
  });

  it("rejects malformed saved fields instead of silently discarding them", () => {
    expect(() => parseJournal({ reviews: "not-an-array" })).toThrow("Invalid saved journal data");
  });

  it("preserves unrelated saved fields when normalizing known fields", () => {
    const journal = parseJournal({ custom: { enabled: true }, listenLater: [{ artist: "A", album: "B", extra: "kept" }] });
    expect(journal.custom).toEqual({ enabled: true });
    expect(journal.listenLater[0]).toHaveProperty("extra", "kept");
  });

  it("migrates legacy top-four review IDs", () => {
    const journal = parseJournal({
      reviews: [{ id: "a", weekKey: "2026-01-05", type: "past", artist: "Artist", album: "Album", rating: 7, topTracks: [], notes: "", reviewedAt: "2026-01-05" }],
      top4All: ["a", null],
    });
    expect(journal.top4All[0]).toMatchObject({ artist: "Artist", album: "Album" });
    expect(journal.top4All[1]).toBeNull();
  });
});
