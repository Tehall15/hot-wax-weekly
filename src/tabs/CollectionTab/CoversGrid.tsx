import type { Review } from "../../types";
import styles from "./CoversGrid.module.css";

function CoversGrid({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;
  return (
    <div
      className={styles.s1}
    >
      {[...reviews].reverse().map((r) => (
        <div
          key={r.id}
          className={styles.s2}
        >
          <div className={styles.s3}>
            {r.image ? (
              <img
                src={r.image}
                alt={r.album}
                className={styles.s4}
              />
            ) : (
              <div
                className={styles.s5}
              >
                💿
              </div>
            )}
            <div
              className={styles.s6}
            >
              <div
                className={styles.s7}
              >
                {r.album}
              </div>
              <div className={styles.s8}>
                {r.rating}/10
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default CoversGrid;
