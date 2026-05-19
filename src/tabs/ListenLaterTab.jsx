import { AlbumArt } from "../components/ui";
import AlbumSearch from "../components/AlbumSearch";

const card = { background: "#111122", border: "1px solid #1e1e3e", borderRadius: 12, padding: 18, marginTop: 14 };

export default function ListenLaterTab({ listenLater, addLL, removeLL, sp }) {
  return (
    <div>
      <div style={{ ...card, background: "#0e0e20" }}>
        <AlbumSearch searchFn={sp.token ? sp.searchAlbums : null} onSelect={addLL} />
      </div>
      {listenLater.length === 0
        ? <div style={{ ...card, textAlign: "center", padding: 40, color: "#555" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🎧</div>Nothing queued.
          </div>
        : listenLater.map((a, i) => (
          <div key={i} style={{ ...card, display: "flex", gap: 12, alignItems: "center" }}>
            <AlbumArt src={a.image} size={48} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{a.album}</div>
              <div style={{ color: "#777", fontSize: 12 }}>{a.artist} · {a.year}</div>
            </div>
            <button onClick={() => removeLL(i)}
              style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 18 }}>×</button>
          </div>
        ))
      }
    </div>
  );
}
