import { useState, useEffect } from "react";
import { AlbumArt, Btn, Pill, StarRating } from "../ui";
import shared from "../../styles/shared.module.css";
import AlbumSearch from "./AlbumSearch";
import TrackPicker from "./TrackPicker";
import styles from "./SlotCard.module.css";
import type {
  Album,
  SearchFn,
  Slot,
  SlotField,
  Track,
  TracklistFn,
} from "../../types";

interface Props {
  slot: Slot;
  label: string;
  badge: string;
  color: string;
  updateSlot: (
    field: SlotField,
    value: Album | number | string | string[] | null,
  ) => void;
  rollRS?: () => void;
  getTracklist?: TracklistFn;
  searchFn?: SearchFn;
}

export default function SlotCard({
  slot,
  label,
  badge,
  color,
  updateSlot,
  rollRS,
  getTracklist,
  searchFn,
}: Props) {
  const [tracks, setTracks] = useState<Track[]>([]);

  useEffect(() => {
    if (!slot.album?.spotifyId || !getTracklist) return;
    let cancelled = false;
    getTracklist(slot.album.spotifyId).then((t) => {
      if (!cancelled && t?.length) setTracks(t);
    });
    return () => {
      cancelled = true;
    };
  }, [slot.album?.spotifyId, getTracklist]);

  return (
    <div
      className={`${shared.card} ${styles.card}`}
      style={{ borderLeftColor: color }}
    >
      <div className={styles.header}>
        <span className={`${shared.sectionLabel} ${styles.slotLabel}`}>
          {label}
        </span>
        <Pill color={color + "22"}>{badge}</Pill>
      </div>

      {slot.id === "rs" && !slot.album && (
        <>
          <div className={styles.randomButton}>
            <Btn onClick={rollRS} variant="ghost">
              🎲 Random pick from Rolling Stone's 500 Greatest Albums
            </Btn>
          </div>
          <AlbumSearch
            searchFn={searchFn}
            onSelect={(a) => updateSlot("album", a)}
          />
        </>
      )}

      {slot.id === "rs" && slot.album && (
        <div className={styles.selectedAlbum}>
          <AlbumArt src={slot.album.image} size={44} />
          <div className={styles.albumDetails}>
            <div className={styles.randomAlbumName}>{slot.album.album}</div>
            <div className={styles.artistName}>{slot.album.artist}</div>
          </div>
          <div className={styles.rollButton}>
            <Btn onClick={rollRS} variant="ghost">
              🎲
            </Btn>
          </div>
        </div>
      )}

      {slot.id !== "rs" && (
        <div className={styles.albumSection}>
          <AlbumSearch
            searchFn={searchFn}
            onSelect={(a) => updateSlot("album", a)}
          />
          {slot.album && (
            <div className={styles.albumPreview}>
              <AlbumArt src={slot.album.image} size={40} />
              <div className={styles.albumDetails}>
                <div className={styles.previewAlbumName}>{slot.album.album}</div>
                <div className={styles.artistName}>{slot.album.artist}</div>
              </div>
              <button
                onClick={() => updateSlot("album", null)}
                className={styles.clearAlbum}
              >
                ×
              </button>
            </div>
          )}
        </div>
      )}

      {slot.album && (
        <>
          <div className={styles.ratingSection}>
            <div className={`${shared.sectionLabel} ${styles.ratingLabel}`}>
              Rating
            </div>
            <StarRating
              value={slot.rating || 0}
              onChange={(v) => updateSlot("rating", v)}
            />
          </div>
          <div className={styles.tracksSection}>
            <TrackPicker
              tracks={tracks}
              selectedTracks={slot.topTracks || []}
              onChange={(v) => updateSlot("topTracks", v)}
            />
          </div>
          <div>
            <div className={`${shared.sectionLabel} ${styles.notesLabel}`}>
              Notes
            </div>
            <textarea
              value={slot.notes || ""}
              onChange={(e) => updateSlot("notes", e.target.value)}
              placeholder="Thoughts…"
              className={styles.notes}
            />
          </div>
        </>
      )}
    </div>
  );
}
