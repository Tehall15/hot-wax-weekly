import { AlbumArt, Pill } from "../../components/ui";
import type { Review } from "../../types";
import shared from "../../styles/shared.module.css";
import styles from "./ReviewList.module.css";

function ReviewList({
  reviews,
  del,
}: {
  reviews: Review[];
  del?: (id: string) => void;
}) {
  if (reviews.length === 0) return null;
  return (
    <div className={styles.s1}>
      <div
        className={styles.s2}
      >
        All Reviews
      </div>
      {[...reviews].reverse().map((r) => (
        <div
          key={r.id}
          className={[shared.card, styles.s3].join(" ")}
        >
          <AlbumArt src={r.image} size={52} />
          <div className={styles.s4}>
            <div
              className={styles.s5}
            >
              <strong
                className={styles.s6}
              >
                {r.album}
              </strong>
              <div className={styles.s7}>
                <span
                  className={styles.s8}
                >
                  {r.rating}/10
                </span>
                {del && (
                  <button
                    onClick={() => del(r.id)}
                    className={styles.s9}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
            <div className={styles.s10}>
              {r.artist} ·{" "}
              {new Date(r.reviewedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>
            <div
              className={styles.s11}
            >
              {r.year && <Pill>{r.year}</Pill>}
              {r.rs500Rank && <Pill color="#2a2000">RS500 #{r.rs500Rank}</Pill>}
            </div>
            {(r.topTracks?.length ?? 0) > 0 && (
              <div
                className={styles.s12}
              >
                {r.topTracks.map((t) => (
                  <span key={t} className={styles.s13}>
                    ★ {t}
                  </span>
                ))}
              </div>
            )}
            {r.notes && (
              <p
                className={styles.s14}
              >
                "{r.notes}"
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ReviewList;
