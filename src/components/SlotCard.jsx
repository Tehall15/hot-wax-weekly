import { useState, useEffect } from "react";
import { AlbumArt, Btn, Pill, StarRating } from "./ui";
import AlbumSearch from "./AlbumSearch";
import TrackPicker from "./TrackPicker";

export default function SlotCard({ slot, label, badge, color, updateSlot, rollRS, getTracklist, searchFn }) {
  const [tracks, setTracks] = useState([]);

  useEffect(() => {
    console.log("[SlotCard tracks]", {
      spotifyId: slot.album?.spotifyId,
      hasGetTracklist: !!getTracklist,
      albumName: slot.album?.album,
    });
    if (!slot.album?.spotifyId || !getTracklist) return;
    let cancelled = false;
    getTracklist(slot.album.spotifyId).then(t => {
      console.log("[SlotCard tracks result]", { count: t?.length, cancelled });
      if (!cancelled && t?.length) setTracks(t);
    });
    return () => { cancelled = true; };
  }, [slot.album?.spotifyId, getTracklist]);

  return (
    <div style={{ background: "#111122", border: "1px solid #1e1e3e", borderLeft: `3px solid ${color}`,
      borderRadius: 12, padding: 18, marginTop: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "#555" }}>{label}</span>
        <Pill color={color + "22"}>{badge}</Pill>
      </div>

      {slot.id === "rs" && !slot.album && (
        <>
          <Btn onClick={rollRS} variant="ghost" style={{ width: "100%", marginBottom: 8 }}>
            🎲 Random pick from Rolling Stone's 500 Greatest Albums
          </Btn>
          <AlbumSearch searchFn={searchFn} onSelect={a => updateSlot("album", a)} />
        </>
      )}

      {slot.id === "rs" && slot.album && (
        <div style={{ marginBottom: 12, display: "flex", gap: 10 }}>
          <AlbumArt src={slot.album.image} size={44} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700 }}>{slot.album.album}</div>
            <div style={{ color: "#888", fontSize: 12 }}>{slot.album.artist}</div>
          </div>
          <Btn onClick={rollRS} variant="ghost" style={{ padding: "5px 10px", fontSize: 11 }}>🎲</Btn>
        </div>
      )}

      {slot.id !== "rs" && (
        <div style={{ marginBottom: 12 }}>
          <AlbumSearch searchFn={searchFn} onSelect={a => updateSlot("album", a)} />
          {slot.album && (
            <div style={{ marginTop: 8, padding: 8, background: "#1a1a2e", borderRadius: 8,
              display: "flex", gap: 10 }}>
              <AlbumArt src={slot.album.image} size={40} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{slot.album.album}</div>
                <div style={{ color: "#888", fontSize: 12 }}>{slot.album.artist}</div>
              </div>
              <button onClick={() => updateSlot("album", null)}
                style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 18 }}>×</button>
            </div>
          )}
        </div>
      )}

      {slot.album && (
        <>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "#555", marginBottom: 8 }}>Rating</div>
            <StarRating value={slot.rating || 0} onChange={v => updateSlot("rating", v)} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <TrackPicker tracks={tracks} selectedTracks={slot.topTracks || []}
              onChange={v => updateSlot("topTracks", v)} />
          </div>
          <div>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "#555", marginBottom: 6 }}>Notes</div>
            <textarea value={slot.notes || ""} onChange={e => updateSlot("notes", e.target.value)}
              placeholder="Thoughts…"
              style={{ width: "100%", background: "#1a1a2e", border: "1px solid #2a2a4e", borderRadius: 8,
                padding: "9px 12px", color: "#e0e0f0", fontSize: 13, resize: "none",
                height: 68, outline: "none", boxSizing: "border-box" }} />
          </div>
        </>
      )}
    </div>
  );
}
