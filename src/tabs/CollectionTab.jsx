import { useState } from "react";
import { AlbumArt, Pill } from "../components/ui";
import { Btn } from "../components/ui";
import { NOW_YEAR } from "../utils/time";

const card = { background: "#111122", border: "1px solid #1e1e3e", borderRadius: 12, padding: 18, marginTop: 14 };

function Top4Section({ reviews, top4All, top4Year, editTop4, setEditTop4, updateTop }) {
  return (
    <>
      {["all", "year"].map(which => {
        const data = which === "all" ? top4All : top4Year;
        const title = which === "all" ? "Top 4 All Time" : `Top 4 ${NOW_YEAR}`;
        return (
          <div key={which} style={{ ...card, background: "#1a1a2e", marginTop: which === "year" ? 10 : 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "#555" }}>{title}</span>
              <Btn onClick={() => setEditTop4(editTop4 === which ? null : which)}
                variant="ghost" style={{ padding: "5px 12px", fontSize: 11 }}>
                {editTop4 === which ? "Done" : "Edit"}
              </Btn>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {data.map((rid, i) => {
                const r = rid ? reviews.find(x => x.id === rid) : null;
                return (
                  <div key={i} style={{ position: "relative", paddingTop: "100%", borderRadius: 8,
                    overflow: "hidden", background: "#0f0f22",
                    border: editTop4 === which ? "2px dashed #F4C542" : "none" }}>
                    <div style={{ position: "absolute", inset: 0 }}>
                      {r ? (
                        <>
                          {r.image
                            ? <img src={r.image} alt={r.album} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center",
                                justifyContent: "center", fontSize: 48 }}>💿</div>
                          }
                          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0,
                            background: "linear-gradient(transparent,rgba(0,0,0,.95))",
                            padding: "30px 8px 8px", fontSize: 11, color: "#fff", lineHeight: 1.3 }}>
                            <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.album}</div>
                            <div style={{ color: "#aaa", fontSize: 10 }}>{r.artist}</div>
                            <div style={{ color: "#F4C542", marginTop: 3, fontSize: 12 }}>{r.rating}/10</div>
                          </div>
                        </>
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center",
                          justifyContent: "center", fontSize: 32, color: "#333" }}>+</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {editTop4 === which && reviews.length > 0 && (
              <div style={{ marginTop: 12, maxHeight: 200, overflowY: "auto" }}>
                {reviews.map(r => (
                  <div key={r.id} onClick={() => {
                    const next = data.findIndex(x => !x);
                    if (next !== -1) updateTop(which, next, r.id);
                  }} style={{ padding: "6px 8px", background: "#0a0a18", borderRadius: 6,
                    marginBottom: 4, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                    <AlbumArt src={r.image} size={32} />
                    <div style={{ flex: 1, fontSize: 12 }}>
                      <div style={{ fontWeight: 600 }}>{r.album}</div>
                      <div style={{ color: "#777", fontSize: 11 }}>{r.artist}</div>
                    </div>
                    <span style={{ color: "#F4C542", fontSize: 12 }}>{r.rating}/10</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

function CoversGrid({ reviews }) {
  if (reviews.length === 0) return null;
  return (
    <div style={{ marginTop: 10, display: "grid",
      gridTemplateColumns: "repeat(auto-fill,minmax(110px,1fr))", gap: 12 }}>
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

function YearWrap({ reviews }) {
  const [wrapYear, setWrapYear] = useState(NOW_YEAR);
  const years = [...new Set(reviews.map(r => new Date(r.reviewedAt).getFullYear()))].sort((a, b) => b - a);
  const yearReviews = reviews.filter(r => new Date(r.reviewedAt).getFullYear() === wrapYear);

  return (
    <div style={{ ...card, marginTop: 14 }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "#555", marginBottom: 12 }}>
        Year Wrap
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
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
        ? <div style={{ color: "#555", fontSize: 13 }}>No reviews for {wrapYear}.</div>
        : <div style={{ fontSize: 20, fontWeight: 700, color: "#F4C542" }}>
            {yearReviews.length} albums
            <span style={{ fontSize: 13, fontWeight: 400, color: "#888", marginLeft: 8 }}>reviewed in {wrapYear}</span>
          </div>
      }
    </div>
  );
}

function ReviewList({ reviews, del }) {
  if (reviews.length === 0) return null;
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2,
        color: "#555", marginBottom: 4, paddingLeft: 2 }}>All Reviews</div>
      {[...reviews].reverse().map(r => (
        <div key={r.id} style={{ ...card, marginTop: 10, display: "flex", gap: 12 }}>
          <AlbumArt src={r.image} size={52} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 4 }}>
              <strong style={{ fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.album}</strong>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <span style={{ color: "#F4C542", fontWeight: 700, fontSize: 14 }}>{r.rating}/10</span>
                {del && (
                  <button onClick={() => del(r.id)}
                    style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 16 }}>×</button>
                )}
              </div>
            </div>
            <div style={{ color: "#777", fontSize: 12, marginTop: 2 }}>
              {r.artist} · {new Date(r.reviewedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </div>
            <div style={{ display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap" }}>
              {r.year && <Pill>{r.year}</Pill>}
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

export default function CollectionTab({ reviews, top4All, top4Year, editTop4, setEditTop4, updateTop, del }) {
  if (reviews.length === 0) return (
    <div style={{ ...card, textAlign: "center", padding: 40, color: "#555", marginTop: 14 }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>🎵</div>
      No reviews yet. Start with This Week!
    </div>
  );

  return (
    <div>
      <Top4Section reviews={reviews} top4All={top4All} top4Year={top4Year}
        editTop4={editTop4} setEditTop4={setEditTop4} updateTop={updateTop} />
      <div style={{ ...card, marginTop: 10 }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "#555", marginBottom: 12 }}>
          Collection ({reviews.length})
        </div>
        <CoversGrid reviews={reviews} />
      </div>
      <YearWrap reviews={reviews} />
      <ReviewList reviews={reviews} del={del} />
    </div>
  );
}
