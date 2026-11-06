import type { ReviewComment } from "../../types";
import styles from "./CommentsSection.module.css";

interface Props {
  comments: ReviewComment[] | undefined;
  commentInput: string;
  userId: string;
  isMe: boolean;
  onDelete: (commentId: string) => void;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
}

export default function CommentsSection({
  comments,
  commentInput,
  userId,
  isMe,
  onDelete,
  onInputChange,
  onSubmit,
}: Props) {
  return (
    <div className={styles.section}>
      {!comments ? (
        <div className={styles.message}>Loading…</div>
      ) : comments.length === 0 ? (
        <div className={`${styles.message} ${styles.emptyMessage}`}>
          No comments yet
        </div>
      ) : (
        <div className={styles.list}>
          {comments.map((comment) => (
            <div key={comment.id} className={styles.comment}>
              <div className={styles.body}>
                <span className={styles.name}>{comment.display_name} </span>
                <span className={styles.text}>{comment.body}</span>
              </div>
              {(comment.user_id === userId || isMe) && (
                <button
                  onClick={() => onDelete(comment.id)}
                  className={styles.delete}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <div className={styles.inputRow}>
        <input
          value={commentInput}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && onSubmit()}
          placeholder="Add a comment…"
          className={styles.input}
        />
        <button onClick={onSubmit} className={styles.submit}>
          →
        </button>
      </div>
    </div>
  );
}
