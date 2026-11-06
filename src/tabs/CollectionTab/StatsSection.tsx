import type { Review } from "../../types";
import { getWeekKey, shiftWeekKey } from "../../utils/time";

function computeStreak(reviews: Review[]) {
  const weekKeys = new Set(
    reviews.filter((r) => r.weekKey).map((r) => r.weekKey),
  );
  let streak = 0;
  let key = getWeekKey();
  while (true) {
    if (weekKeys.has(key)) {
      streak++;
      key = shiftWeekKey(key, -7);
    } else break;
  }
  return streak;
}

function StatsSection({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;
  const total = reviews.length;
  const avg = (reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1);
  const streak = computeStreak(reviews);

  return (
    <section className="mt-3 rounded-xl border bg-card p-4">
      <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        Stats
      </h2>
      <div className="mb-1 grid grid-cols-3 gap-3">
        {[
          { label: "Reviews", value: total },
          { label: "Avg Rating", value: `${avg}/10` },
          { label: "Week Streak", value: `${streak}🔥` },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg bg-muted/50 px-3 py-2.5 text-center">
            <div className="text-lg font-bold text-primary">{value}</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              {label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default StatsSection;
