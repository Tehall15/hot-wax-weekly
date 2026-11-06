import type { Review } from "../../types";

export interface FeedItem {
  review: Review;
  displayName: string | null;
  userId: string | undefined;
  isMe: boolean;
  avatar: string | null;
}

export type ReactionMap = Record<
  string,
  Record<string, { count: number; mine: boolean }>
>;
