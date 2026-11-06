import { useState } from "react";
import AlbumArt from "@/components/ui/AlbumArt";
import { Button } from "@/components/ui/button";
import { NOW_YEAR } from "../../utils/time";
import type { Review } from "../../types";
import { cn } from "@/lib/utils";

function YearWrap({ reviews }: { reviews: Review[] }) {
  const [wrapYear, setWrapYear] = useState(NOW_YEAR);
  const years = [
    ...new Set(reviews.map((r) => new Date(r.reviewedAt).getFullYear())),
  ].sort((a, b) => b - a);
  const yr = reviews.filter(
    (r) => new Date(r.reviewedAt).getFullYear() === wrapYear,
  );

  const avgYr = yr.length
    ? (yr.reduce((s, r) => s + r.rating, 0) / yr.length).toFixed(1)
    : null;
  const bestYr = yr.length
    ? [...yr].sort((a, b) => b.rating - a.rating)[0]
    : null;
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const monthCounts = yr.reduce(
    (acc, r) => {
      const m = new Date(r.reviewedAt).getMonth();
      acc[m] = (acc[m] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>,
  );
  const busyMonth = Object.keys(monthCounts).length
    ? months[
        Number(Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0][0])
      ]
    : null;

  return (
    <section className="mt-3 rounded-xl border bg-card p-4">
      <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        Year Wrap
      </h2>
      <div className="mb-3 flex flex-wrap gap-2">
        {(years.length > 0 ? years : [NOW_YEAR]).map((y) => (
          <Button
            key={y}
            type="button"
            variant={wrapYear === y ? "secondary" : "outline"}
            size="sm"
            onClick={() => setWrapYear(y)}
            className={cn(wrapYear === y && "text-primary")}
          >
            {y}
          </Button>
        ))}
      </div>
      {yr.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          No reviews for {wrapYear}.
        </div>
      ) : (
        <>
          <div className="mb-3 grid grid-cols-3 gap-2.5">
            {[
              { label: "Albums", value: yr.length },
              { label: "Avg Rating", value: `${avgYr}/10` },
              { label: "Best Month", value: busyMonth || "—" },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg bg-muted/50 px-2 py-2.5 text-center">
                <div className="text-base font-bold text-primary">{value}</div>
                <div className="mt-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
                  {label}
                </div>
              </div>
            ))}
          </div>
          {bestYr && (
            <div className="flex items-center gap-2.5 rounded-lg bg-muted/50 p-2.5">
              <AlbumArt src={bestYr.image} size={36} />
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
                  Top Album of {wrapYear}
                </div>
                <div className="truncate text-[13px] font-bold">
                  {bestYr.album}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {bestYr.artist}
                </div>
              </div>
              <div className="shrink-0 text-[15px] font-bold text-primary">
                {bestYr.rating}/10
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default YearWrap;
