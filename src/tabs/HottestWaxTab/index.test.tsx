import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@supabase/supabase-js";
import type { Review } from "../../types";

const mocks = vi.hoisted(() => ({ reactionReads: 0, failReaction: false, failNotification: false, savedReaction: false }));

vi.mock("../../lib/supabase", () => ({
  supabase: {
    from: (table: string) => {
      const result = () => {
        if (table === "reactions") {
          mocks.reactionReads++;
          return { data: mocks.savedReaction ? [{ review_id: "1", emoji: "🔥", user_id: "demo" }] : [], error: null };
        }
        return { data: [], error: null };
      };
      const query = {
        select: () => query,
        eq: () => query,
        in: () => query,
        delete: () => query,
        insert: () => {
          if (table === "notifications" && mocks.failNotification) return Promise.reject(new Error("offline"));
          if (table === "reactions" && !mocks.failReaction) mocks.savedReaction = true;
          return Promise.resolve({ error: table === "reactions" && mocks.failReaction ? new Error("offline") : null });
        },
        then: (resolve: (value: ReturnType<typeof result>) => void) => Promise.resolve(result()).then(resolve),
      };
      return query;
    },
  },
}));
vi.mock("./FeedItemCard", () => ({
  default: ({ item, reactions, onToggleReaction }: {
    item: { review: Review };
    reactions: Record<string, Record<string, { count: number }>>;
    onToggleReaction: (id: string, emoji: string, owner: string) => void;
  }) => (
    <button onClick={() => onToggleReaction(item.review.id, "🔥", "friend")}>
      {item.review.album}: {reactions[item.review.id]?.["🔥"]?.count ?? 0}
    </button>
  ),
}));

import HottestWaxTab from "./index";

const user: User = { id: "demo", aud: "authenticated", app_metadata: {}, user_metadata: {}, created_at: "2026-01-01" };
const review: Review = { id: "1", weekKey: "2026-11-02", type: "past", artist: "A", album: "Album", rating: 8, topTracks: [], notes: "", reviewedAt: "2026-11-03" };

describe("feed reactions", () => {
  beforeEach(() => {
    mocks.reactionReads = 0;
    mocks.failReaction = false;
    mocks.failNotification = false;
    mocks.savedReaction = false;
  });

  it("reloads reaction counts when the review list changes", async () => {
    const { rerender } = render(<HottestWaxTab user={user} reviews={[review]} userAvatar={null} />);
    await waitFor(() => expect(mocks.reactionReads).toBe(1));
    rerender(<HottestWaxTab user={user} reviews={[review, { ...review, id: "2", album: "Other" }]} userAvatar={null} />);
    await waitFor(() => expect(mocks.reactionReads).toBe(2));
  });

  it("rolls back a reaction and reports an error if saving fails", async () => {
    mocks.failReaction = true;
    render(<HottestWaxTab user={user} reviews={[review]} userAvatar={null} />);
    const button = await screen.findByText("Album: 0");
    fireEvent.click(button);
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not update your reaction");
    expect(screen.getByText("Album: 0")).toBeInTheDocument();
  });

  it("keeps a saved reaction when the notification request rejects", async () => {
    mocks.failNotification = true;
    render(<HottestWaxTab user={user} reviews={[review]} userAvatar={null} />);
    await waitFor(() => expect(mocks.reactionReads).toBe(1));
    fireEvent.click(screen.getByText("Album: 0"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Reaction saved, but the notification could not be sent");
    expect(screen.getByText("Album: 1")).toBeInTheDocument();
  });
});
