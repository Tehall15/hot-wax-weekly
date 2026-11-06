import { useState } from "react";
import { AlbumArt } from "../../components/ui";
import { NOW_YEAR } from "../../utils/time";
import type { Review } from "../../types";
import shared from "../../styles/shared.module.css";
import styles from "./YearWrap.module.css";

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
    <div className={[shared.card, styles.s1].join(" ")}>
      <div
        className={styles.s2}
      >
        Year Wrap
      </div>
      <div
        className={styles.s3}
      >
        {(years.length > 0 ? years : [NOW_YEAR]).map((y) => (
          <button
            key={y}
            onClick={() => setWrapYear(y)}
            className={styles.s4} style={{ border: `1px solid ${wrapYear === y ? "#F4C542" : "#2a2a4e"}`, background: wrapYear === y ? "#2a2000" : "transparent", color: wrapYear === y ? "#F4C542" : "#666" }}
          >
            {y}
          </button>
        ))}
      </div>
      {yr.length === 0 ? (
        <div className={styles.s5}>
          No reviews for {wrapYear}.
        </div>
      ) : (
        <>
          <div
            className={styles.s6}
          >
            {[
              { label: "Albums", value: yr.length },
              { label: "Avg Rating", value: `${avgYr}/10` },
              { label: "Best Month", value: busyMonth || "—" },
            ].map(({ label, value }) => (
              <div
                key={label}
                className={styles.s7}
              >
                <div
                  className={styles.s8}
                >
                  {value}
                </div>
                <div
                  className={styles.s9}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
          {bestYr && (
            <div
              className={styles.s10}
            >
              <AlbumArt src={bestYr.image} size={36} />
              <div className={styles.s11}>
                <div
                  className={styles.s12}
                >
                  Top Album of {wrapYear}
                </div>
                <div
                  className={styles.s13}
                >
                  {bestYr.album}
                </div>
                <div className={styles.s14}>
                  {bestYr.artist}
                </div>
              </div>
              <div
                className={styles.s15}
              >
                {bestYr.rating}/10
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default YearWrap;
