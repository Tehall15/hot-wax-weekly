import { Button } from "@/components/ui/button";
import type { Album, Review } from "../../types";

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
    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
      {EMOJIS.map((emoji) => {
        const reaction = reactionState?.[emoji];
        const count = reaction?.count || 0;
        const mine = reaction?.mine || false;
        return (
          <Button
            key={emoji}
            onClick={() => onToggleReaction(review.id, emoji, reviewOwnerId)}
            variant={mine ? "default" : "outline"}
            size="sm"
            className="gap-1 rounded-full px-2 text-xs"
          >
            <span>{emoji}</span>
            {count > 0 && <span className="text-[10px] font-semibold">{count}</span>}
          </Button>
        );
      })}
      <div className="ml-auto flex items-center gap-2">
        {!isMe && addLL && (
          <Button variant="ghost" size="xs" onClick={() => onAddLater(album)}>
            + Later
          </Button>
        )}
        <Button
          variant="ghost"
          size="xs"
          onClick={() => onRecommend(album)}
          title="Recommend to a friend"
        >
          ↗ Rec
        </Button>
        <Button
          variant={commentsOpen ? "secondary" : "ghost"}
          size="xs"
          onClick={() => onToggleComments(review.id)}
        >
          💬 {commentCount}
        </Button>
      </div>
    </div>
  );
}
