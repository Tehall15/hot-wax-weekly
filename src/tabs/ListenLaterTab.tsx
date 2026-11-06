import { AlbumArt } from "../components/ui";
import AlbumSearch from "../components/album/AlbumSearch";
import type { SpotifyApi } from "../hooks/useSpotify";
import type { Album, ListenLaterItem } from "../types";
import shared from "../styles/shared.module.css";
import styles from "./ListenLaterTab.module.css";

export default function ListenLaterTab({
  listenLater,
  addLL,
  removeLL,
  sp,
  onMoveToReview,
}: {
  listenLater: ListenLaterItem[];
  addLL: (album: Album) => void;
  removeLL: (idx: number) => void;
  sp: SpotifyApi;
  onMoveToReview: (album: Album, idx: number) => void;
}) {
  return (
    <div>
      <div className={`${shared.card} ${styles.searchCard}`}>
        <AlbumSearch
          searchFn={sp.token ? sp.searchAlbums : undefined}
          onSelect={addLL}
        />
      </div>
      {listenLater.length === 0 ? (
        <div className={`${shared.card} ${styles.empty}`}>
          <div className={styles.emptyIcon}>🎧</div>Nothing queued.
        </div>
      ) : (
        listenLater.map((a, i) => (
          <div key={i} className={`${shared.card} ${styles.albumCard}`}>
            <AlbumArt src={a.image} size={48} />
            <div className={styles.albumDetails}>
              <div className={styles.albumName}>{a.album}</div>
              <div className={styles.albumMetadata}>
                {a.artist}
                {a.year ? ` · ${a.year}` : ""}
              </div>
            </div>
            <button
              onClick={() => onMoveToReview(a, i)}
              className={styles.moveButton}
            >
              + This Week
            </button>
            <button onClick={() => removeLL(i)} className={styles.removeButton}>
              ×
            </button>
          </div>
        ))
      )}
    </div>
  );
}
