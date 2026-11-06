import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ responses: {} as Record<string, { data: unknown; error: Error | null }> }));
vi.mock("./supabase", () => ({
  supabase: {
    from: (table: string) => {
      const query = {
        select: () => query,
        eq: () => query,
        in: () => query,
        order: () => query,
        then: (resolve: (response: unknown) => void) => Promise.resolve(mocks.responses[table]).then(resolve),
      };
      return query;
    },
  },
}));

import { loadCommentCounts, loadFriendFeed, loadReactions } from "./feed";

describe("feed repository", () => {
  beforeEach(() => {
    mocks.responses = {};
  });

  it("loads followed profiles and their reviews", async () => {
    const review = { id: "review", artist: "Artist", album: "Album" };
    mocks.responses.follows = { data: [{ following_id: "friend" }], error: null };
    mocks.responses.app_data = { data: [{ id: "friend", display_name: "Friend", data: { reviews: [review], avatar: "cover" } }], error: null };
    expect(await loadFriendFeed("me")).toEqual([{ review, displayName: "Friend", userId: "friend", isMe: false, avatar: "cover" }]);
  });

  it("aggregates reactions and comment counts", async () => {
    mocks.responses.reactions = { data: [
      { review_id: "r", emoji: "fire", user_id: "me" },
      { review_id: "r", emoji: "fire", user_id: "friend" },
    ], error: null };
    mocks.responses.comments = { data: [{ review_id: "r" }, { review_id: "r" }], error: null };
    expect(await loadReactions(["r"], "me")).toEqual({ r: { fire: { count: 2, mine: true } } });
    expect(await loadCommentCounts(["r"])).toEqual({ r: 2 });
  });

  it("propagates backend errors", async () => {
    mocks.responses.follows = { data: null, error: new Error("offline") };
    await expect(loadFriendFeed("me")).rejects.toThrow("offline");
  });
});
