import type { Review } from "../../types";
import shared from "../../styles/shared.module.css";
import styles from "./StatsSection.module.css";

function computeStreak(reviews: Review[]) {
  const weekKeys = new Set(
    reviews.filter((r) => r.weekKey).map((r) => r.weekKey),
  );
  let streak = 0;
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);
  let d = new Date(monday);
  while (true) {
    const key = d.toISOString().split("T")[0];
    if (weekKeys.has(key)) {
      streak++;
      d.setDate(d.getDate() - 7);
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
    <div className={[shared.card, styles.s1].join(" ")}>
      <div
        className={styles.s2}
      >
        Stats
      </div>
      <div
        className={styles.s3}
      >
        {[
          { label: "Reviews", value: total },
          { label: "Avg Rating", value: `${avg}/10` },
          { label: "Week Streak", value: `${streak}🔥` },
        ].map(({ label, value }) => (
          <div
            key={label}
            className={styles.s4}
          >
            <div className={styles.s5}>
              {value}
            </div>
            <div
              className={styles.s6}
            >
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default StatsSection;
