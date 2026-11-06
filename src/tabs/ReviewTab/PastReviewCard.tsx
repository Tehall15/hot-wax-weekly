import { useEffect, useState } from "react";
import { AlbumArt, Btn, StarRating } from "../../components/ui";
import AlbumSearch from "../../components/album/AlbumSearch";
import TrackPicker from "../../components/album/TrackPicker";
import type { SpotifyApi } from "../../hooks/useSpotify";
import type { Album, Track } from "../../types";
import shared from "../../styles/shared.module.css";
import styles from "./PastReviewCard.module.css";

export type PastSaveFn = (
  album: Album,
  rating: number,
  topTracks: string[],
  notes: string,
) => void;

export default function PastReviewCard({
  sp,
  onSave,
}: {
  sp: SpotifyApi;
  onSave: PastSaveFn;
}) {
  const [album, setAlbum] = useState<Album | null>(null);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [topTracks, setTopTracks] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!album?.spotifyId || !sp?.getTracklist) return;
    let cancelled = false;
    sp.getTracklist(album.spotifyId).then((t) => {
      if (!cancelled && t?.length) setTracks(t);
    });
    return () => {
      cancelled = true;
    };
  }, [album?.spotifyId, sp?.getTracklist]);

  const reset = () => {
    setAlbum(null);
    setRating(0);
    setNotes("");
    setTracks([]);
    setTopTracks([]);
    setSaved(false);
  };

  const save = () => {
    if (!album || !rating) return;
    onSave(album, rating, topTracks, notes);
    setSaved(true);
    setTimeout(reset, 800);
  };

  return (
    <div className={`${shared.card} ${styles.card}`}>
      <div className={styles.sectionLabel}>Past Review</div>

      <AlbumSearch
        searchFn={sp?.token ? sp.searchAlbums : undefined}
        onSelect={(a) => {
          setAlbum(a);
          setRating(0);
          setNotes("");
          setTopTracks([]);
          setTracks([]);
        }}
      />

      {album && (
        <>
          <div className={styles.selectedAlbum}>
            <AlbumArt src={album.image} size={40} />
            <div className={styles.selectedAlbumDetails}>
              <div className={styles.selectedAlbumName}>{album.album}</div>
              <div className={styles.selectedAlbumArtist}>
                {album.artist}
                {album.year ? ` · ${album.year}` : ""}
              </div>
            </div>
            <button onClick={reset} className={styles.clearButton}>
              ×
            </button>
          </div>

          <div className={styles.ratingSection}>
            <div className={styles.fieldLabel}>Rating</div>
            <StarRating value={rating} onChange={setRating} />
          </div>

          {tracks.length > 0 && (
            <div className={styles.trackSection}>
              <TrackPicker
                tracks={tracks}
                selectedTracks={topTracks}
                onChange={setTopTracks}
              />
            </div>
          )}

          <div className={styles.notesSection}>
            <div className={styles.notesLabel}>Notes</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Thoughts…"
              className={styles.notesInput}
            />
          </div>

          <div className={styles.saveButton}>
            <Btn onClick={save} variant="primary" disabled={!rating}>
              {saved ? "Saved ✓" : "Save Review"}
            </Btn>
          </div>
        </>
      )}
    </div>
  );
}
