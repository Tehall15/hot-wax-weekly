const card = { background: "#111122", border: "1px solid #1e1e3e", borderRadius: 12, padding: 18, marginTop: 14 };

export default function CoversTab({ reviews }) {
  if (reviews.length === 0) return (
    <div style={{ ...card, textAlign: "center", padding: 40, color: "#555" }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>🎨</div>No covers yet.
    </div>
  );

  return (
    <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(110px,1fr))", gap: 12 }}>
      {[...reviews].reverse().map(r => (
        <div key={r.id} style={{ position: "relative", paddingTop: "100%", borderRadius: 8,
          overflow: "hidden", background: "#1a1a2e" }}>
          <div style={{ position: "absolute", inset: 0 }}>
            {r.image
              ? <img src={r.image} alt={r.album} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 32 }}>💿</div>
            }
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0,
              background: "linear-gradient(transparent,rgba(0,0,0,.9))",
              padding: "20px 6px 6px", fontSize: 10, color: "#fff", fontWeight: 600, lineHeight: 1.2 }}>
              <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.album}</div>
              <div style={{ color: "#F4C542", marginTop: 2 }}>{r.rating}/10</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
