import { supabase } from "./supabase";
import type { ProfileRow, ReactionRow, ReviewComment } from "../types";
import type { FeedItem, ReactionMap } from "../tabs/HottestWaxTab/types";

export async function loadFriendFeed(userId: string): Promise<FeedItem[]> {
  const { data, error } = await supabase.from("follows").select("following_id").eq("follower_id", userId);
  if (error) throw error;
  const ids = (data || []).map((row: { following_id: string }) => row.following_id);
  if (!ids.length) return [];
  const { data: rows, error: profilesError } = await supabase.from("app_data").select("id, display_name, data").in("id", ids);
  if (profilesError) throw profilesError;
  return ((rows || []) as ProfileRow[]).flatMap((row) =>
    (row.data?.reviews || []).map((review) => ({
      review, displayName: row.display_name, userId: row.id, isMe: false, avatar: row.data?.avatar || null,
    })),
  );
}

export async function loadReactions(ids: string[], userId: string): Promise<ReactionMap> {
  const { data, error } = await supabase.from("reactions").select("review_id, emoji, user_id").in("review_id", ids);
  if (error) throw error;
  const map: ReactionMap = {};
  ((data || []) as ReactionRow[]).forEach((reaction) => {
    if (!map[reaction.review_id]) map[reaction.review_id] = {};
    if (!map[reaction.review_id][reaction.emoji]) map[reaction.review_id][reaction.emoji] = { count: 0, mine: false };
    map[reaction.review_id][reaction.emoji].count++;
    if (reaction.user_id === userId) map[reaction.review_id][reaction.emoji].mine = true;
  });
  return map;
}

export async function loadCommentCounts(ids: string[]): Promise<Record<string, number>> {
  const { data, error } = await supabase.from("comments").select("review_id").in("review_id", ids);
  if (error) throw error;
  const map: Record<string, number> = {};
  (data || []).forEach((comment: { review_id: string }) => {
    map[comment.review_id] = (map[comment.review_id] || 0) + 1;
  });
  return map;
}

export async function loadComments(reviewId: string): Promise<ReviewComment[]> {
  const { data, error } = await supabase.from("comments").select("*").eq("review_id", reviewId).order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []) as ReviewComment[];
}
