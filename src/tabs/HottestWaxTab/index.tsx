import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import type {
  Album,
  ReactionRow,
  Review,
  ReviewComment,
  ProfileRow,
} from "../../types";
import RecommendModal from "../../components/social/RecommendModal";
import FeedItemCard from "./FeedItemCard";
import type { FeedItem, ReactionMap } from "./types";

export default function HottestWaxTab({
  user,
  reviews: ownReviews,
  addLL,
  userAvatar,
}: {
  user: User;
  reviews: Review[];
  addLL?: (album: Album) => void;
  userAvatar: string | null;
}) {
  const [friendItems, setFriendItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reactions, setReactions] = useState<ReactionMap>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, ReviewComment[]>>({});
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [recommendAlbum, setRecommendAlbum] = useState<Album | null>(null);

  const displayName = user?.user_metadata?.display_name || "You";

  useEffect(() => {
    if (!user) return;
    supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id)
      .then(({ data }) => {
        const ids = (data || []).map(
          (row: { following_id: string }) => row.following_id,
        );
        if (ids.length === 0) {
          setLoading(false);
          return;
        }
        supabase
          .from("app_data")
          .select("id, display_name, data")
          .in("id", ids)
          .then(({ data: rows }) => {
            const items: FeedItem[] = [];
            ((rows || []) as ProfileRow[]).forEach((row) => {
              (row.data?.reviews || []).forEach((review) => {
                items.push({
                  review,
                  displayName: row.display_name,
                  userId: row.id,
                  isMe: false,
                  avatar: row.data?.avatar || null,
                });
              });
            });
            setFriendItems(items);
            setLoading(false);
          });
      });
  }, [user]);

  const ownItems: FeedItem[] = (ownReviews || []).map((review) => ({
    review,
    displayName,
    userId: user?.id,
    isMe: true,
    avatar: userAvatar,
  }));
  const feed = [...ownItems, ...friendItems]
    .sort(
      (a, b) =>
        new Date(b.review.reviewedAt).getTime() -
        new Date(a.review.reviewedAt).getTime(),
    )
    .slice(0, 60);

  useEffect(() => {
    if (loading) return;
    const ids = [
      ...(ownReviews || []).map((review) => review.id),
      ...friendItems.map((item) => item.review.id),
    ].filter(Boolean);
    if (!ids.length) return;

    supabase
      .from("reactions")
      .select("review_id, emoji, user_id")
      .in("review_id", ids)
      .then(({ data }) => {
        const map: ReactionMap = {};
        ((data || []) as ReactionRow[]).forEach((reaction) => {
          if (!map[reaction.review_id]) map[reaction.review_id] = {};
          if (!map[reaction.review_id][reaction.emoji]) {
            map[reaction.review_id][reaction.emoji] = { count: 0, mine: false };
          }
          map[reaction.review_id][reaction.emoji].count++;
          if (reaction.user_id === user.id) {
            map[reaction.review_id][reaction.emoji].mine = true;
          }
        });
        setReactions(map);
      });

    supabase
      .from("comments")
      .select("review_id")
      .in("review_id", ids)
      .then(({ data }) => {
        const map: Record<string, number> = {};
        (data || []).forEach((comment: { review_id: string }) => {
          map[comment.review_id] = (map[comment.review_id] || 0) + 1;
        });
        setCommentCounts(map);
      });
  }, [loading]);

  const toggleReaction = async (
    reviewId: string,
    emoji: string,
    reviewOwnerId?: string,
  ) => {
    const isMine = reactions[reviewId]?.[emoji]?.mine;
    setReactions((previous) => ({
      ...previous,
      [reviewId]: {
        ...previous[reviewId],
        [emoji]: {
          count: isMine
            ? Math.max(0, (previous[reviewId]?.[emoji]?.count || 1) - 1)
            : (previous[reviewId]?.[emoji]?.count || 0) + 1,
          mine: !isMine,
        },
      },
    }));
    if (isMine) {
      await supabase
        .from("reactions")
        .delete()
        .eq("review_id", reviewId)
        .eq("user_id", user.id)
        .eq("emoji", emoji);
    } else {
      const name = user.user_metadata?.display_name || "Someone";
      await supabase.from("reactions").insert({
        review_id: reviewId,
        user_id: user.id,
        display_name: name,
        emoji,
      });
      if (reviewOwnerId && reviewOwnerId !== user.id) {
        await supabase.from("notifications").insert({
          user_id: reviewOwnerId,
          type: "reaction",
          from_user_id: user.id,
          from_display_name: name,
        });
      }
    }
  };

  const toggleComments = async (reviewId: string) => {
    const isOpen = openComments[reviewId];
    setOpenComments((previous) => ({ ...previous, [reviewId]: !isOpen }));
    if (!isOpen && !comments[reviewId]) {
      const { data } = await supabase
        .from("comments")
        .select("*")
        .eq("review_id", reviewId)
        .order("created_at", { ascending: true });
      setComments((previous) => ({
        ...previous,
        [reviewId]: (data || []) as ReviewComment[],
      }));
    }
  };

  const deleteComment = async (reviewId: string, commentId: string) => {
    await supabase.from("comments").delete().eq("id", commentId);
    setComments((previous) => ({
      ...previous,
      [reviewId]: (previous[reviewId] || []).filter(
        (comment) => comment.id !== commentId,
      ),
    }));
    setCommentCounts((previous) => ({
      ...previous,
      [reviewId]: Math.max(0, (previous[reviewId] || 1) - 1),
    }));
  };

  const submitComment = async (reviewId: string, reviewOwnerId?: string) => {
    const body = (commentInput[reviewId] || "").trim();
    if (!body) return;
    const name = user.user_metadata?.display_name || "Someone";
    const { data } = await supabase
      .from("comments")
      .insert({ review_id: reviewId, user_id: user.id, display_name: name, body })
      .select()
      .single();
    if (data) {
      const comment = data as ReviewComment;
      setComments((previous) => ({
        ...previous,
        [reviewId]: [...(previous[reviewId] || []), comment],
      }));
      setCommentCounts((previous) => ({
        ...previous,
        [reviewId]: (previous[reviewId] || 0) + 1,
      }));
      setCommentInput((previous) => ({ ...previous, [reviewId]: "" }));
      if (reviewOwnerId && reviewOwnerId !== user.id) {
        await supabase.from("notifications").insert({
          user_id: reviewOwnerId,
          type: "comment",
          from_user_id: user.id,
          from_display_name: name,
        });
      }
    }
  };

  if (loading && feed.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!loading && feed.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center">
        <div className="mb-3 text-3xl">🎵</div>
        <div className="mb-1.5 text-sm text-muted-foreground">No reviews yet</div>
        <div className="text-xs text-muted-foreground">
          Start with This Week, then find bandmates 💿
        </div>
      </div>
    );
  }

  return (
    <>
      {recommendAlbum && (
        <RecommendModal
          album={recommendAlbum}
          user={user}
          onClose={() => setRecommendAlbum(null)}
        />
      )}
      <div className="rounded-xl border border-border bg-card px-4">
        <div className="flex flex-col">
          {feed.map((item, index) => (
            <FeedItemCard
              key={item.review.id}
              item={item}
              isLast={index === feed.length - 1}
              reactions={reactions}
              commentCount={commentCounts[item.review.id] || 0}
              commentsOpen={!!openComments[item.review.id]}
              comments={comments[item.review.id]}
              commentInput={commentInput[item.review.id] || ""}
              userId={user.id}
              addLL={addLL}
              onToggleReaction={toggleReaction}
              onAddLater={(album) => addLL?.(album)}
              onRecommend={setRecommendAlbum}
              onToggleComments={toggleComments}
              onDeleteComment={deleteComment}
              onCommentInputChange={(reviewId, value) =>
                setCommentInput((previous) => ({ ...previous, [reviewId]: value }))
              }
              onSubmitComment={submitComment}
            />
          ))}
        </div>
      </div>
    </>
  );
}

