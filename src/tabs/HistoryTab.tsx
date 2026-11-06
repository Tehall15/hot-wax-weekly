import AlbumArt from "@/components/ui/AlbumArt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Review } from "../types";
import { parseDateKey } from "../utils/time";

export default function HistoryTab({
  reviews,
  del,
}: {
  reviews: Review[];
  del: (id: string) => void;
}) {
  if (reviews.length === 0)
    return (
      <div className="mt-4 rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
        <div className="mb-3 text-4xl">📀</div>No reviews yet.
      </div>
    );

  return (
    <div>
      {[...reviews].reverse().map((r) => (
        <div
          key={r.id}
          className="mt-4 flex gap-3 rounded-xl border border-border bg-card p-4"
        >
          <AlbumArt src={r.image} size={52} />
          <div className="min-w-0 flex-1">
            <div className="flex justify-between gap-1">
              <strong className="text-sm">{r.album}</strong>
              <div className="flex gap-2">
                <span className="text-sm font-bold text-primary">{r.rating}/10</span>
                <Button
                  onClick={() => del(r.id)}
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Delete review for ${r.album}`}
                  className="text-muted-foreground hover:text-destructive"
                >
                  ×
                </Button>
              </div>
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {r.artist} · Week of{" "}
              {parseDateKey(r.weekKey).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Badge variant="outline">{r.year}</Badge>
              {r.rs500Rank && (
                <Badge
                  variant="outline"
                  className="border-primary/30 bg-primary/10 text-primary"
                >
                  RS500 #{r.rs500Rank}
                </Badge>
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
                "{r.notes}"
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
