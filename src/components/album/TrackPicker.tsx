import { useState } from "react";
import { Btn } from "../ui";
import type { Track } from "../../types";
import styles from "./TrackPicker.module.css";

export default function TrackPicker({
  tracks,
  selectedTracks,
  onChange,
}: {
  tracks: Track[];
  selectedTracks: string[];
  onChange: (tracks: string[]) => void;
}) {
  const [input, setInput] = useState("");

  const toggle = (name: string) => {
    if (selectedTracks.includes(name))
      onChange(selectedTracks.filter((t) => t !== name));
    else if (selectedTracks.length < 5) onChange([...selectedTracks, name]);
  };

  const add = () => {
    const t = input.trim();
    if (t && !selectedTracks.includes(t) && selectedTracks.length < 5) {
      onChange([...selectedTracks, t]);
      setInput("");
    }
  };

  return (
    <div>
      <div className={styles.heading}>
        Top Tracks{" "}
        <span className={styles.hint}>(up to 5)</span>
      </div>
      {tracks.length > 0 ? (
        <div className={styles.trackList}>
          {tracks.map((t) => {
            const sel = selectedTracks.includes(t.name);
            return (
              <button
                key={t.num}
                onClick={() => toggle(t.name)}
                className={`${styles.trackButton} ${sel ? styles.selected : ""}`}
              >
                {t.num}. {t.name} {sel && "★"}
              </button>
            );
          })}
        </div>
      ) : (
        <div className={styles.addTrackRow}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Type track name…"
            className={styles.input}
          />
          <div className={styles.addButton}>
            <Btn onClick={add} variant="ghost">
              Add
            </Btn>
          </div>
        </div>
      )}
      {selectedTracks.length > 0 && (
        <div className={styles.selectedTracks}>
          {selectedTracks.map((t) => (
            <span key={t} className={styles.selectedTrack}>
              ★ {t}
              <button
                onClick={() => onChange(selectedTracks.filter((x) => x !== t))}
                className={styles.removeTrack}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
