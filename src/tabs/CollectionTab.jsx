import { useState } from "react";
import { AlbumArt, Pill } from "../components/ui";
import { Btn } from "../components/ui";
import { LOCAL_DB } from "../utils/data";
import { NOW_YEAR } from "../utils/time";

const card = { background: "#111122", border: "1px solid #1e1e3e", borderRadius: 12, padding: 18, marginTop: 14 };

// Handles both new format (album object) and old format (review ID string)
function resolveSlot(item, reviews) {
  if (!item) return null;
  if (typeof item === "object") return item;
  const r = reviews.find(x => x.id === item);
  return r ? { artist: r.artist, album: r.album, image: r.image, spotifyId: r.spotifyId } : null;
}

function Top4Section({ reviews, top4All, top4Year, editTop4, setEditTop4, updateTop, swapTop, sp }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  const search = async (val) => {
    setQ(val);
    if (val.length < 2) { setResults([]); return; }
    let found = [];
    if (sp?.searchAlbums) found = (await sp.searchAlbums(val)) || [];
    if (!found.length) {
      const low = val.toLowerCase();
      found = LOCAL_DB.filter(a =>
        a.artist.toLowerCase().includes(low) || a.album.toLowerCase().includes(low)
      ).slice(0, 6);
    }
    setResults(found);
  };

  const clearSearch = () => { setQ(""); setResults([]); };

  return (
    <>
      {["all"].map(which => {
        const data = which === "all" ? top4All : top4Year;
        const title = which === "all" ? "Top 4 All Time" : `Top 4 ${NOW_YEAR}`;
        const isEditing = editTop4 === which;

        return (
          <div key={which} style={{ ...card, background: "#1a1a2e", marginTop: which === "year" ? 10 : 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "#555" }}>{title}</span>
              <Btn
                onClick={() => { setEditTop4(isEditing ? null : which); clearSearch(); }}
                variant="ghost" style={{ padding: "3px 10px", fontSize: 11 }}>
                {isEditing ? "Done" : "Edit"}
              </Btn>
            </div>

            {/* 4 small covers in a row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {data.map((item, i) => {
                const alb = resolveSlot(item, reviews);
                const isDragging = draggedIdx === i;
                const isDragOver = dragOverIdx === i && draggedIdx !== i;
                return (
                  <div key={i}
                    draggable={!!alb}
                    onDragStart={() => { setDraggedIdx(i); }}
                    onDragOver={e => { e.preventDefault(); setDragOverIdx(i); }}
                    onDragLeave={() => setDragOverIdx(null)}
                    onDrop={e => {
                      e.preventDefault();
                      if (draggedIdx !== null && draggedIdx !== i) swapTop(which, draggedIdx, i);
                      setDraggedIdx(null); setDragOverIdx(null);
                    }}
                    onDragEnd={() => { setDraggedIdx(null); setDragOverIdx(null); }}
                    style={{ position: "relative", paddingTop: "100%", borderRadius: 6,
                      overflow: "hidden", background: "#0f0f22",
                      border: isDragOver ? "2px solid #F4C542" : isEditing ? "2px dashed #3a3a5e" : "1px solid #1e1e3e",
                      opacity: isDragging ? 0.4 : 1,
                      cursor: alb ? "grab" : "default",
                      transition: "opacity 0.15s, border 0.15s" }}>
                    <div style={{ position: "absolute", inset: 0 }}>
                      {alb ? (
                        <>
                          {alb.image
                            ? <img src={alb.image} alt={alb.album} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center",
                                justifyContent: "center", fontSize: 22 }}>💿</div>
                          }
                          {/* number badge */}
                          <div style={{ position: "absolute", top: 4, left: 4, width: 16, height: 16,
                            background: "#F4C542", borderRadius: "50%", display: "flex",
                            alignItems: "center", justifyContent: "center",
                            fontSize: 9, fontWeight: 700, color: "#0d0d1a" }}>{i + 1}</div>
                          {/* clear button in edit mode */}
                          {isEditing && (
                            <button onClick={() => updateTop(which, i, null)}
                              style={{ position: "absolute", top: 3, right: 3, background: "rgba(0,0,0,.75)",
                                border: "none", color: "#fff", borderRadius: "50%", width: 18, height: 18,
                                cursor: "pointer", fontSize: 13, lineHeight: 1,
                                display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>×</button>
                          )}
                          {/* album name overlay */}
                          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0,
                            background: "linear-gradient(transparent,rgba(0,0,0,.92))",
                            padding: "14px 5px 5px", fontSize: 9, color: "#fff", lineHeight: 1.2 }}>
                            <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600 }}>{alb.album}</div>
                          </div>
                        </>
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center",
                          justifyContent: "center", fontSize: 20, color: "#2a2a4e" }}>
                          {isEditing ? "+" : ""}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Spotify search in edit mode */}
            {isEditing && (
              <div style={{ marginTop: 12 }}>
                <input
                  value={q}
                  onChange={e => search(e.target.value)}
                  placeholder={sp?.token ? "Search any album on Spotify…" : "Search album…"}
                  style={{ width: "100%", background: "#0f0f22", border: "1px solid #2a2a4e", borderRadius: 8,
                    padding: "9px 12px", color: "#e0e0f0", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
                {results.length > 0 && (
                  <div style={{ marginTop: 6, maxHeight: 220, overflowY: "auto" }}>
                    {results.map((r, idx) => (
                      <div key={idx}
                        onClick={() => {
                          const next = data.findIndex(x => !resolveSlot(x, reviews));
                          const slot = next !== -1 ? next : 0;
                          updateTop(which, slot, { artist: r.artist, album: r.album, image: r.image || null, spotifyId: r.spotifyId || null });
                          clearSearch();
                        }}
                        style={{ padding: "7px 8px", background: "#0a0a18", borderRadius: 6,
                          marginBottom: 4, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
                        onMouseEnter={e => e.currentTarget.style.background = "#141428"}
                        onMouseLeave={e => e.currentTarget.style.background = "#0a0a18"}>
                        {r.image
                          ? <img src={r.image} alt="" style={{ width: 38, height: 38, borderRadius: 4, objectFit: "cover", flexShrink: 0 }} />
                          : <div style={{ width: 38, height: 38, borderRadius: 4, background: "#1a1a2e", flexShrink: 0,
                              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>💿</div>
                        }
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.album}</div>
                          <div style={{ color: "#777", fontSize: 11 }}>{r.artist}{r.year ? ` · ${r.year}` : ""}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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

function computeStreak(reviews) {
  const weekKeys = new Set(reviews.filter(r => r.weekKey).map(r => r.weekKey));
  let streak = 0;
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);
  let d = new Date(monday);
  while (true) {
    const key = d.toISOString().split("T")[0];
    if (weekKeys.has(key)) { streak++; d.setDate(d.getDate() - 7); }
    else break;
  }
  return streak;
}

function StatsSection({ reviews }) {
  if (reviews.length === 0) return null;
  const total = reviews.length;
  const avg = (reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1);
  const streak = computeStreak(reviews);

  return (
    <div style={{ ...card, marginTop: 14 }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "#555", marginBottom: 14 }}>
        Stats
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Reviews", value: total },
          { label: "Avg Rating", value: `${avg}/10` },
          { label: "Week Streak", value: `${streak}🔥` },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: "#0f0f1a", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#F4C542" }}>{value}</div>
            <div style={{ fontSize: 10, color: "#555", marginTop: 2, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function YearWrap({ reviews }) {
  const [wrapYear, setWrapYear] = useState(NOW_YEAR);
  const years = [...new Set(reviews.map(r => new Date(r.reviewedAt).getFullYear()))].sort((a, b) => b - a);
  const yr = reviews.filter(r => new Date(r.reviewedAt).getFullYear() === wrapYear);

  const avgYr = yr.length ? (yr.reduce((s, r) => s + r.rating, 0) / yr.length).toFixed(1) : null;
  const bestYr = yr.length ? [...yr].sort((a, b) => b.rating - a.rating)[0] : null;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthCounts = yr.reduce((acc, r) => {
    const m = new Date(r.reviewedAt).getMonth();
    acc[m] = (acc[m] || 0) + 1;
    return acc;
  }, {});
  const busyMonth = Object.keys(monthCounts).length
    ? months[Number(Object.entries(monthCounts).sort((a,b) => b[1]-a[1])[0][0])]
    : null;

  return (
    <div style={{ ...card, marginTop: 14 }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "#555", marginBottom: 12 }}>
        Year Wrap
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
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
      {yr.length === 0 ? (
        <div style={{ color: "#555", fontSize: 13 }}>No reviews for {wrapYear}.</div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
            {[
              { label: "Albums", value: yr.length },
              { label: "Avg Rating", value: `${avgYr}/10` },
              { label: "Best Month", value: busyMonth || "—" },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: "#0f0f1a", borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#F4C542" }}>{value}</div>
                <div style={{ fontSize: 9, color: "#555", marginTop: 2, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
              </div>
            ))}
          </div>
          {bestYr && (
            <div style={{ background: "#0f0f1a", borderRadius: 8, padding: "10px 12px",
              display: "flex", gap: 10, alignItems: "center" }}>
              <AlbumArt src={bestYr.image} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>Top Album of {wrapYear}</div>
                <div style={{ fontWeight: 700, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{bestYr.album}</div>
                <div style={{ fontSize: 11, color: "#888" }}>{bestYr.artist}</div>
              </div>
              <div style={{ color: "#F4C542", fontWeight: 700, fontSize: 15, flexShrink: 0 }}>{bestYr.rating}/10</div>
            </div>
          )}
        </>
      )}
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

export default function CollectionTab({ reviews, top4All, top4Year, editTop4, setEditTop4, updateTop, swapTop, del, sp }) {
  if (reviews.length === 0) return (
    <div style={{ ...card, textAlign: "center", padding: 40, color: "#555", marginTop: 14 }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>🎵</div>
      No reviews yet. Start with This Week!
    </div>
  );

  return (
    <div>
      <StatsSection reviews={reviews} />
      <Top4Section reviews={reviews} top4All={top4All} top4Year={top4Year}
        editTop4={editTop4} setEditTop4={setEditTop4} updateTop={updateTop} swapTop={swapTop} sp={sp} />
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
