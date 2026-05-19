import { useState } from "react";
import { Btn } from "./ui";

export default function TrackPicker({ tracks, selectedTracks, onChange }) {
  const [input, setInput] = useState("");

  const toggle = (name) => {
    if (selectedTracks.includes(name)) onChange(selectedTracks.filter(t => t !== name));
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
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "#666", marginBottom: 8 }}>
        Top Tracks <span style={{ color: "#444", fontStyle: "italic", textTransform: "none" }}>(up to 5)</span>
      </div>
      {tracks.length > 0 ? (
        <div style={{ maxHeight: 180, overflowY: "auto", display: "flex", flexWrap: "wrap", gap: 6 }}>
          {tracks.map(t => {
            const sel = selectedTracks.includes(t.name);
            return (
              <button key={t.num} onClick={() => toggle(t.name)}
                style={{ background: sel ? "#2a2a1a" : "#1a1a2e",
                  border: `1px solid ${sel ? "#F4C542" : "#2a2a4e"}`,
                  borderRadius: 6, padding: "5px 10px", color: sel ? "#F4C542" : "#888",
                  fontSize: 12, cursor: "pointer" }}>
                {t.num}. {t.name} {sel && "★"}
              </button>
            );
          })}
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8 }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && add()}
            placeholder="Type track name…"
            style={{ flex: 1, background: "#1a1a2e", border: "1px solid #333", borderRadius: 8,
              padding: "8px 12px", color: "#e0e0f0", fontSize: 13, outline: "none" }} />
          <Btn onClick={add} variant="ghost" style={{ padding: "8px 14px" }}>Add</Btn>
        </div>
      )}
      {selectedTracks.length > 0 && (
        <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
          {selectedTracks.map(t => (
            <span key={t} style={{ background: "#1f1f0a", border: "1px solid #F4C542", borderRadius: 20,
              padding: "3px 10px", fontSize: 12, color: "#F4C542", display: "flex", alignItems: "center", gap: 6 }}>
              ★ {t}
              <button onClick={() => onChange(selectedTracks.filter(x => x !== t))}
                style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 13 }}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
