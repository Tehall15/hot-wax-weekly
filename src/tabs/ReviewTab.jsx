import { useState, useEffect } from "react";
import SlotCard from "../components/SlotCard";
import AlbumSearch from "../components/AlbumSearch";
import TrackPicker from "../components/TrackPicker";
import { AlbumArt, StarRating, Btn } from "../components/ui";

const card = { background: "#111122", border: "1px solid #1e1e3e", borderRadius: 12, padding: 18, marginTop: 14 };

function PastReviewCard({ sp, onSave }) {
  const [album, setAlbum] = useState(null);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [tracks, setTracks] = useState([]);
  const [topTracks, setTopTracks] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!album?.spotifyId || !sp?.getTracklist) return;
    let cancelled = false;
    sp.getTracklist(album.spotifyId).then(t => { if (!cancelled && t?.length) setTracks(t); });
    return () => { cancelled = true; };
  }, [album?.spotifyId, sp?.getTracklist]);

  const reset = () => {
    setAlbum(null); setRating(0); setNotes("");
    setTracks([]); setTopTracks([]); setSaved(false);
  };

  const save = () => {
    if (!album || !rating) return;
    onSave(album, rating, topTracks, notes);
    setSaved(true);
    setTimeout(reset, 800);
  };

  return (
    <div style={{ ...card, borderLeft: "3px solid #7c5cbf" }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "#555", marginBottom: 12 }}>
        Past Review
      </div>

      <AlbumSearch searchFn={sp?.token ? sp.searchAlbums : null}
        onSelect={a => { setAlbum(a); setRating(0); setNotes(""); setTopTracks([]); setTracks([]); }} />

      {album && (
        <>
          <div style={{ marginTop: 8, padding: 8, background: "#1a1a2e", borderRadius: 8,
            display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}>
            <AlbumArt src={album.image} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{album.album}</div>
              <div style={{ color: "#888", fontSize: 12 }}>{album.artist}{album.year ? ` · ${album.year}` : ""}</div>
            </div>
            <button onClick={reset}
              style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 18 }}>×</button>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "#555", marginBottom: 8 }}>Rating</div>
            <StarRating value={rating} onChange={setRating} />
          </div>

          {tracks.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <TrackPicker tracks={tracks} selectedTracks={topTracks} onChange={setTopTracks} />
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "#555", marginBottom: 6 }}>Notes</div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Thoughts…"
              style={{ width: "100%", background: "#1a1a2e", border: "1px solid #2a2a4e", borderRadius: 8,
                padding: "9px 12px", color: "#e0e0f0", fontSize: 13, resize: "none",
                height: 68, outline: "none", boxSizing: "border-box" }} />
          </div>

          <Btn onClick={save} variant="primary" disabled={!rating} style={{ width: "100%" }}>
            {saved ? "Saved ✓" : "Save Review"}
          </Btn>
        </>
      )}
    </div>
  );
}

export default function ReviewTab({ slots, weekKey, shiftWeek, resetWeek, updateSlot, rollRS, sp, completed, submit, onSavePast }) {
  return (
    <div>
      <div style={{ ...card, background: "#0e0e20", display: "flex", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 12, color: "#555" }}>Week of</div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>
            {new Date(weekKey).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <button onClick={() => shiftWeek(-7)}
              style={{ background: "#1a1a2e", border: "1px solid #2a2a4e", color: "#888",
                borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 11 }}>
              ← Previous
            </button>
            <button onClick={resetWeek}
              style={{ background: "#1a1a2e", border: "1px solid #2a2a4e", color: "#888",
                borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 11 }}>
              Current
            </button>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#F4C542" }}>{completed}/3</div>
          <div style={{ fontSize: 11, color: "#555" }}>ready</div>
        </div>
      </div>

      <SlotCard slot={slots[0]} label="Contemporary 1" badge="New" color="#4ECDC4"
        updateSlot={(f, v) => updateSlot("c1", f, v)}
        getTracklist={sp.getTracklist} searchFn={sp.token ? sp.searchAlbums : null} />
      <SlotCard slot={slots[1]} label="Contemporary 2" badge="New" color="#45B7D1"
        updateSlot={(f, v) => updateSlot("c2", f, v)}
        getTracklist={sp.getTracklist} searchFn={sp.token ? sp.searchAlbums : null} />
      <SlotCard slot={slots[2]} label="Classic Pick" badge="Classic" color="#F4C542"
        updateSlot={(f, v) => updateSlot("rs", f, v)} rollRS={rollRS}
        getTracklist={sp.getTracklist} searchFn={sp.token ? sp.searchAlbums : null} />

      {completed > 0 && (
        <Btn onClick={submit} variant="primary"
          style={{ width: "100%", marginTop: 20, padding: 14, fontSize: 15 }}>
          Save {completed} Review{completed !== 1 ? "s" : ""} →
        </Btn>
      )}

      <PastReviewCard sp={sp} onSave={onSavePast} />
    </div>
  );
}
