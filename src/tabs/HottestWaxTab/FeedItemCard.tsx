import type { Album, ReviewComment } from "../../types";
import { AlbumArt } from "../../components/ui";
import AvatarDisplay from "../../components/avatar/AvatarDisplay";
import { slugify } from "../../utils/format";
import CommentsSection from "./CommentsSection";
import RatingBadge from "./RatingBadge";
import ReactionBar from "./ReactionBar";
import type { FeedItem, ReactionMap } from "./types";
import styles from "./FeedItemCard.module.css";

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
    <div className={`${styles.item} ${isLast ? styles.lastItem : ""}`}>
      <div className={styles.header}>
        <AvatarDisplay avatar={avatar} name={displayName} size={28} muted={isMe} />
        <div className={styles.reviewer}>
          {isMe ? (
            <span className={styles.you}>You</span>
          ) : (
            <a href={`/u/${slugify(displayName)}`} className={styles.profileLink}>
              {displayName}
            </a>
          )}
        </div>
        <div className={styles.date}>
          {new Date(review.reviewedAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
          })}
        </div>
      </div>

      <div className={styles.content}>
        <AlbumArt src={review.image} size={52} muted />
        <div className={styles.details}>
          <div className={styles.albumDetails}>
            <div className={styles.album}>{review.album}</div>
            <div className={styles.artist}>
              {review.artist}
              {review.year ? <span className={styles.year}> · {review.year}</span> : null}
            </div>
          </div>
          <div className={styles.rating}>
            <RatingBadge value={review.rating} />
          </div>
          {(review.topTracks?.length ?? 0) > 0 && (
            <div className={styles.tracks}>
              {review.topTracks.map((track) => (
                <span key={track} className={styles.track}>
                  ★ {track}
                </span>
              ))}
            </div>
          )}
          {review.notes && <div className={styles.notes}>"{review.notes}"</div>}

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

