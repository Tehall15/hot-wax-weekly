import AlbumArt from "@/components/ui/AlbumArt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Review } from "../../types";

function ReviewList({
  reviews,
  del,
}: {
  reviews: Review[];
  del?: (id: string) => void;
}) {
  if (reviews.length === 0) return null;
  return (
    <section className="mt-4">
      <h2 className="mb-2 px-0.5 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        All Reviews
      </h2>
      {[...reviews].reverse().map((r) => (
        <article
          key={r.id}
          className="mt-2 flex gap-3 rounded-xl border bg-card p-3"
        >
          <AlbumArt src={r.image} size={52} />
          <div className="min-w-0 flex-1">
            <div className="flex justify-between gap-1">
              <strong className="truncate text-sm">{r.album}</strong>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-sm font-bold text-primary">{r.rating}/10</span>
                {del && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => del(r.id)}
                    aria-label={`Delete review for ${r.album}`}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    ×
                  </Button>
                )}
              </div>
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {r.artist} ·{" "}
              {new Date(r.reviewedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {r.year && <Badge variant="secondary">{r.year}</Badge>}
              {r.rs500Rank && (
                <Badge variant="default">RS500 #{r.rs500Rank}</Badge>
              )}
            </div>
            {(r.topTracks?.length ?? 0) > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {r.topTracks.map((t) => (
                  <span key={t} className="text-[11px] text-primary">
                    ★ {t}
                  </span>
                ))}
              </div>
            )}
            {r.notes && (
              <p className="mb-0 mt-1.5 text-xs italic text-muted-foreground">
                &quot;{r.notes}&quot;
              </p>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}

export default ReviewList;
