import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import { loadCommentCounts, loadComments, loadFriendFeed, loadReactions } from "../../lib/feed";
import type {
  Album,
  Review,
  ReviewComment,
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
  const [error, setError] = useState<string | null>(null);
  const [activityVersion, setActivityVersion] = useState(0);
  const pendingReactions = useRef(new Set<string>());
  const pendingComments = useRef(new Set<string>());
  const loadingComments = useRef(new Set<string>());
  const reactionVersion = useRef(0);
  const commentVersion = useRef(0);

  const displayName = user?.user_metadata?.display_name || "You";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFriendItems([]);
    async function loadFriends() {
      try {
        const items = await loadFriendFeed(user.id);
        if (!cancelled) setFriendItems(items);
      } catch (err) {
        console.error("[feed load failed]", err);
        if (!cancelled) setError("Could not load your feed.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadFriends();
    return () => { cancelled = true; };
  }, [user.id]);

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
    let cancelled = false;
    const ids = [
      ...(ownReviews || []).map((review) => review.id),
      ...friendItems.map((item) => item.review.id),
    ].filter(Boolean);
    if (!ids.length) {
      setReactions({});
      setCommentCounts({});
      return;
    }

    const reactionsAtRequest = reactionVersion.current;
    const commentsAtRequest = commentVersion.current;
    loadReactions(ids, user.id)
      .then((map) => {
        if (cancelled || reactionVersion.current !== reactionsAtRequest || pendingReactions.current.size) return;
        setReactions(map);
      }).catch((error: unknown) => {
        console.error("[reaction load failed]", error);
        if (!cancelled) setError("Could not load reactions.");
      });

    loadCommentCounts(ids)
      .then((map) => {
        if (cancelled || commentVersion.current !== commentsAtRequest || pendingComments.current.size) return;
        setCommentCounts(map);
      }).catch((error: unknown) => {
        console.error("[comment count load failed]", error);
        if (!cancelled) setError("Could not load comment counts.");
      });
    return () => { cancelled = true; };
  }, [loading, ownReviews, friendItems, user.id, activityVersion]);

  const toggleReaction = async (
    reviewId: string,
    emoji: string,
    reviewOwnerId?: string,
  ) => {
    const key = `${reviewId}:${emoji}`;
    if (pendingReactions.current.has(key)) return;
    pendingReactions.current.add(key);
    reactionVersion.current++;
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
    try {
      if (isMine) {
        const { error } = await supabase
          .from("reactions")
          .delete()
          .eq("review_id", reviewId)
          .eq("user_id", user.id)
          .eq("emoji", emoji);
        if (error) throw error;
      } else {
        const name = user.user_metadata?.display_name || "Someone";
        const { error } = await supabase.from("reactions").insert({
          review_id: reviewId,
          user_id: user.id,
          display_name: name,
          emoji,
        });
        if (error) throw error;
        if (reviewOwnerId && reviewOwnerId !== user.id) {
          try {
            const { error: notificationError } = await supabase.from("notifications").insert({
              user_id: reviewOwnerId,
              type: "reaction",
              from_user_id: user.id,
              from_display_name: name,
            });
            if (notificationError) throw notificationError;
          } catch (notificationError) {
            console.error("[reaction notification failed]", notificationError);
            setError("Reaction saved, but the notification could not be sent.");
          }
        }
      }
    } catch (err) {
      console.error("[reaction update failed]", err);
      setError("Could not update your reaction.");
      setReactions((previous) => ({
        ...previous,
        [reviewId]: { ...previous[reviewId], [emoji]: {
          count: isMine ? (previous[reviewId]?.[emoji]?.count || 0) + 1 : Math.max(0, (previous[reviewId]?.[emoji]?.count || 1) - 1),
          mine: !!isMine,
        } },
      }));
    } finally {
      reactionVersion.current++;
      pendingReactions.current.delete(key);
      setActivityVersion((version) => version + 1);
    }
  };

  const toggleComments = async (reviewId: string) => {
    const isOpen = openComments[reviewId];
    setOpenComments((previous) => ({ ...previous, [reviewId]: !isOpen }));
    if (!isOpen && !comments[reviewId] && !loadingComments.current.has(reviewId)) {
      loadingComments.current.add(reviewId);
      try {
        const data = await loadComments(reviewId);
        setComments((previous) => ({
          ...previous,
          [reviewId]: data,
        }));
      } catch (error) {
        console.error("[comments load failed]", error);
        setError("Could not load comments.");
        setOpenComments((previous) => ({ ...previous, [reviewId]: false }));
      } finally {
        loadingComments.current.delete(reviewId);
      }
    }
  };

  const deleteComment = async (reviewId: string, commentId: string) => {
    const key = `delete:${commentId}`;
    if (pendingComments.current.has(key)) return;
    pendingComments.current.add(key);
    commentVersion.current++;
    try {
      const { error } = await supabase.from("comments").delete().eq("id", commentId);
      if (error) throw error;
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
    } catch (error) {
      console.error("[comment delete failed]", error);
      setError("Could not delete the comment.");
    } finally {
      commentVersion.current++;
      pendingComments.current.delete(key);
      setActivityVersion((version) => version + 1);
    }
  };

  const submitComment = async (reviewId: string, reviewOwnerId?: string) => {
    const body = (commentInput[reviewId] || "").trim();
    if (!body || !comments[reviewId]) return;
    const key = `post:${reviewId}`;
    if (pendingComments.current.has(key)) return;
    pendingComments.current.add(key);
    commentVersion.current++;
    const name = user.user_metadata?.display_name || "Someone";
    let comment: ReviewComment;
    try {
      const { data, error } = await supabase
        .from("comments")
        .insert({ review_id: reviewId, user_id: user.id, display_name: name, body })
        .select()
        .single();
      if (error) throw error;
      if (!data) throw new Error("Comment was not returned after saving");
      comment = data as ReviewComment;
    } catch (error) {
      console.error("[comment save failed]", error);
      setError("Could not post your comment.");
      commentVersion.current++;
      pendingComments.current.delete(key);
      setActivityVersion((version) => version + 1);
      return;
    }
    setComments((previous) => ({
      ...previous,
      [reviewId]: [...(previous[reviewId] || []), comment],
    }));
    setCommentCounts((previous) => ({
      ...previous,
      [reviewId]: (previous[reviewId] || 0) + 1,
    }));
    setCommentInput((previous) => ({
      ...previous,
      [reviewId]: previous[reviewId]?.trim() === body ? "" : previous[reviewId],
    }));
    if (reviewOwnerId && reviewOwnerId !== user.id) {
      try {
        const { error: notificationError } = await supabase.from("notifications").insert({
          user_id: reviewOwnerId,
          type: "comment",
          from_user_id: user.id,
          from_display_name: name,
        });
        if (notificationError) throw notificationError;
      } catch (notificationError) {
        console.error("[comment notification failed]", notificationError);
        setError("Comment saved, but the notification could not be sent.");
      }
    }
    commentVersion.current++;
    pendingComments.current.delete(key);
    setActivityVersion((version) => version + 1);
  };

  if (loading && feed.length === 0 && !error) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!loading && feed.length === 0 && !error) {
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
      {error && <div role="alert" className="p-3 text-destructive">{error} <button type="button" onClick={() => setError(null)}>Dismiss</button></div>}
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
