import { AlbumArt, Pill } from "../components/ui";

const card = { background: "#111122", border: "1px solid #1e1e3e", borderRadius: 12, padding: 18, marginTop: 14 };

export default function HistoryTab({ reviews, del }) {
  if (reviews.length === 0) return (
    <div style={{ ...card, textAlign: "center", padding: 40, color: "#555" }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>📀</div>No reviews yet.
    </div>
  );

  return (
    <div>
      {[...reviews].reverse().map(r => (
        <div key={r.id} style={{ ...card, display: "flex", gap: 12 }}>
          <AlbumArt src={r.image} size={52} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 4 }}>
              <strong style={{ fontSize: 14 }}>{r.album}</strong>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ color: "#F4C542", fontWeight: 700, fontSize: 14 }}>{r.rating}/10</span>
                <button onClick={() => del(r.id)}
                  style={{ background: "none", border: "none", color: "#444", cursor: "pointer" }}>×</button>
              </div>
            </div>
            <div style={{ color: "#777", fontSize: 12, marginTop: 2 }}>
              {r.artist} · Week of {new Date(r.weekKey).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </div>
            <div style={{ display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap" }}>
              <Pill>{r.year}</Pill>
              {r.rs500Rank && <Pill color="#2a2000">RS500 #{r.rs500Rank}</Pill>}
            </div>
            {r.topTracks?.length > 0 && (
              <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
                {r.topTracks.map(t => <span key={t} style={{ fontSize: 11, color: "#F4C542" }}>★ {t}</span>)}
              </div>
            )}
            {r.notes && <p style={{ color: "#666", fontSize: 12, marginTop: 6, marginBottom: 0, fontStyle: "italic" }}>"{r.notes}"</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
