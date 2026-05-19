import { NOW_YEAR } from "../utils/time";

const card = { background: "#111122", border: "1px solid #1e1e3e", borderRadius: 12, padding: 18, marginTop: 14 };

export default function WrapTab({ reviews, wrapYear, setWrapYear }) {
  const years = [...new Set(reviews.map(r => new Date(r.reviewedAt).getFullYear()))].sort((a, b) => b - a);
  const yearReviews = reviews.filter(r => new Date(r.reviewedAt).getFullYear() === wrapYear);

  return (
    <div>
      <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: "#666" }}>Year:</span>
        {(years.length > 0 ? years : [NOW_YEAR]).map(y => (
          <button key={y} onClick={() => setWrapYear(y)}
            style={{ padding: "5px 14px", borderRadius: 20,
              border: `1px solid ${wrapYear === y ? "#F4C542" : "#2a2a4e"}`,
              background: wrapYear === y ? "#2a2000" : "transparent",
              color: wrapYear === y ? "#F4C542" : "#666", cursor: "pointer", fontSize: 13 }}>
            {y}
          </button>
        ))}
      </div>
      {yearReviews.length === 0
        ? <div style={{ ...card, textAlign: "center", padding: 40, color: "#555" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🎵</div>No reviews for {wrapYear}.
          </div>
        : <div style={card}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#F4C542" }}>
              {yearReviews.length} albums
            </div>
            <div style={{ color: "#888", marginTop: 4 }}>reviewed in {wrapYear}</div>
          </div>
      }
    </div>
  );
}
