import type { Album, Review } from "../../types";
import styles from "./ReactionBar.module.css";

const EMOJIS = ["🔥", "✨", "💿", "😮"];

interface Props {
  review: Review;
  reviewOwnerId?: string;
  isMe: boolean;
  addLL?: (album: Album) => void;
  reactionState: Record<string, { count: number; mine: boolean }> | undefined;
  commentCount: number;
  commentsOpen: boolean;
  onToggleReaction: (reviewId: string, emoji: string, reviewOwnerId?: string) => void;
  onAddLater: (album: Album) => void;
  onRecommend: (album: Album) => void;
  onToggleComments: (reviewId: string) => void;
}

export default function ReactionBar({
  review,
  reviewOwnerId,
  isMe,
  addLL,
  reactionState,
  commentCount,
  commentsOpen,
  onToggleReaction,
  onAddLater,
  onRecommend,
  onToggleComments,
}: Props) {
  const album: Album = {
    artist: review.artist,
    album: review.album,
    image: review.image,
    year: review.year,
    spotifyId: review.spotifyId,
  };

  return (
    <div className={styles.bar}>
      {EMOJIS.map((emoji) => {
        const reaction = reactionState?.[emoji];
        const count = reaction?.count || 0;
        const mine = reaction?.mine || false;
        return (
          <button
            key={emoji}
            onClick={() => onToggleReaction(review.id, emoji, reviewOwnerId)}
            className={`${styles.reaction} ${mine ? styles.reactionMine : ""}`}
          >
            <span>{emoji}</span>
            {count > 0 && <span className={styles.count}>{count}</span>}
          </button>
        );
      })}
      <div className={styles.actions}>
        {!isMe && addLL && (
          <button className={styles.action} onClick={() => onAddLater(album)}>
            + Later
          </button>
        )}
        <button
          className={styles.action}
          onClick={() => onRecommend(album)}
          title="Recommend to a friend"
        >
          ↗ Rec
        </button>
        <button
          className={`${styles.action} ${commentsOpen ? styles.actionOpen : ""}`}
          onClick={() => onToggleComments(review.id)}
        >
          💬 {commentCount}
        </button>
      </div>
    </div>
  );
}
