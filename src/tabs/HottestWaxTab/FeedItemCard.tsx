import type { Album, ReviewComment } from "../../types";
import AlbumArt from "@/components/ui/AlbumArt";
import { cn } from "@/lib/utils";
import AvatarDisplay from "../../components/avatar/AvatarDisplay";
import { slugify } from "../../utils/format";
import CommentsSection from "./CommentsSection";
import RatingBadge from "./RatingBadge";
import ReactionBar from "./ReactionBar";
import type { FeedItem, ReactionMap } from "./types";

interface Props {
  item: FeedItem;
  isLast: boolean;
  reactions: ReactionMap;
  commentCount: number;
  commentsOpen: boolean;
  comments: ReviewComment[] | undefined;
  commentInput: string;
  userId: string;
  addLL?: (album: Album) => void;
  onToggleReaction: (reviewId: string, emoji: string, reviewOwnerId?: string) => void;
  onAddLater: (album: Album) => void;
  onRecommend: (album: Album) => void;
  onToggleComments: (reviewId: string, reviewOwnerId?: string) => void;
  onDeleteComment: (reviewId: string, commentId: string) => void;
  onCommentInputChange: (reviewId: string, value: string) => void;
  onSubmitComment: (reviewId: string, reviewOwnerId?: string) => void;
}

export default function FeedItemCard({
  item,
  isLast,
  reactions,
  commentCount,
  commentsOpen,
  comments,
  commentInput,
  userId,
  addLL,
  onToggleReaction,
  onAddLater,
  onRecommend,
  onToggleComments,
  onDeleteComment,
  onCommentInputChange,
  onSubmitComment,
}: Props) {
  const { review, displayName, userId: ownerId, isMe, avatar } = item;

  return (
    <div className={cn("border-b border-border py-3.5", isLast && "border-b-0")}>
      <div className="mb-2.5 flex items-center gap-2">
        <AvatarDisplay avatar={avatar} name={displayName} size={28} muted={isMe} />
        <div className="min-w-0 flex-1">
          {isMe ? (
            <span className="text-xs font-semibold text-muted-foreground">You</span>
          ) : (
            <a
              href={`/u/${slugify(displayName)}`}
              className="text-xs font-semibold text-primary hover:underline"
            >
              {displayName}
            </a>
          )}
        </div>
        <div className="shrink-0 text-[10px] text-muted-foreground/60">
          {new Date(review.reviewedAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
          })}
        </div>
      </div>

      <div className="flex items-start gap-3">
        <AlbumArt src={review.image} size={52} muted />
        <div className="min-w-0 flex-1">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold">{review.album}</div>
            <div className="text-xs text-muted-foreground">
              {review.artist}
              {review.year ? <span className="text-muted-foreground/70"> · {review.year}</span> : null}
            </div>
          </div>
          <div className="mt-1">
            <RatingBadge value={review.rating} />
          </div>
          {(review.topTracks?.length ?? 0) > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {review.topTracks.map((track) => (
                <span
                  key={track}
                  className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] text-primary"
                >
                  ★ {track}
                </span>
              ))}
            </div>
          )}
          {review.notes && (
            <div className="mt-1.5 text-xs italic leading-relaxed text-muted-foreground">
              "{review.notes}"
            </div>
          )}

          <ReactionBar
            review={review}
            reviewOwnerId={ownerId}
            isMe={isMe}
            addLL={addLL}
            reactionState={reactions[review.id]}
            commentCount={commentCount}
            commentsOpen={commentsOpen}
            onToggleReaction={onToggleReaction}
            onAddLater={onAddLater}
            onRecommend={onRecommend}
            onToggleComments={(reviewId) => onToggleComments(reviewId, ownerId)}
          />

          {commentsOpen && (
            <CommentsSection
              comments={comments}
              commentInput={commentInput}
              userId={userId}
              isMe={isMe}
              onDelete={(commentId) => onDeleteComment(review.id, commentId)}
              onInputChange={(value) => onCommentInputChange(review.id, value)}
              onSubmit={() => onSubmitComment(review.id, ownerId)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
