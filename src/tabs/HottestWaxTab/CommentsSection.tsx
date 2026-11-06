import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ReviewComment } from "../../types";

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
    <div className="mt-2.5 border-t border-border pt-2.5">
      {!comments ? (
        <div className="text-[11px] text-muted-foreground">Loading…</div>
      ) : comments.length === 0 ? (
        <div className="mb-2 text-[11px] text-muted-foreground">No comments yet</div>
      ) : (
        <div className="mb-2.5 flex flex-col gap-2">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-1.5">
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-semibold text-primary">{comment.display_name} </span>
                <span className="text-xs text-muted-foreground">{comment.body}</span>
              </div>
              {(comment.user_id === userId || isMe) && (
                <Button
                  onClick={() => onDelete(comment.id)}
                  variant="ghost"
                  size="icon-xs"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  ×
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-1.5">
        <Input
          value={commentInput}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && onSubmit()}
          placeholder="Add a comment…"
          className="h-8 flex-1 text-xs"
        />
        <Button onClick={onSubmit} size="icon" aria-label="Submit comment">
          →
        </Button>
      </div>
    </div>
  );
}
