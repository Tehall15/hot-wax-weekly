import { AlbumArt, Pill } from "../components/ui";
import type { Review } from "../types";
import shared from "../styles/shared.module.css";
import styles from "./HistoryTab.module.css";

export default function HistoryTab({
  reviews,
  del,
}: {
  reviews: Review[];
  del: (id: string) => void;
}) {
  if (reviews.length === 0)
    return (
      <div className={`${shared.card} ${styles.empty}`}>
        <div className={styles.emptyIcon}>📀</div>No reviews yet.
      </div>
    );

  return (
    <div>
      {[...reviews].reverse().map((r) => (
        <div key={r.id} className={`${shared.card} ${styles.reviewCard}`}>
          <AlbumArt src={r.image} size={52} />
          <div className={styles.reviewDetails}>
            <div className={styles.reviewHeader}>
              <strong className={styles.albumName}>{r.album}</strong>
              <div className={styles.ratingActions}>
                <span className={styles.rating}>{r.rating}/10</span>
                <button onClick={() => del(r.id)} className={styles.deleteButton}>
                  ×
                </button>
              </div>
            </div>
            <div className={styles.metadata}>
              {r.artist} · Week of{" "}
              {new Date(r.weekKey).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })}
            </div>
            <div className={styles.pills}>
              <Pill>{r.year}</Pill>
              {r.rs500Rank && <Pill color="#2a2000">RS500 #{r.rs500Rank}</Pill>}
            </div>
            {(r.topTracks?.length ?? 0) > 0 && (
              <div className={styles.topTracks}>
                {r.topTracks.map((t) => (
                  <span key={t} className={styles.topTrack}>
                    ★ {t}
                  </span>
                ))}
              </div>
            )}
            {r.notes && <p className={styles.notes}>"{r.notes}"</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
