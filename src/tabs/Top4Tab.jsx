import { AlbumArt, Btn } from "../components/ui";
import { NOW_YEAR } from "../utils/time";

const card = { background: "#111122", border: "1px solid #1e1e3e", borderRadius: 12, padding: 18, marginTop: 14 };

export default function Top4Tab({ reviews, top4All, top4Year, editTop4, setEditTop4, updateTop }) {
  return (
    <div>
      {["all", "year"].map(which => {
        const data = which === "all" ? top4All : top4Year;
        const title = which === "all" ? "Top 4 All Time" : `Top 4 ${NOW_YEAR}`;
        return (
          <div key={which} style={{ ...card, background: "#1a1a2e", marginTop: which === "year" ? 16 : 14 }}>
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
                  <div key={r.id} style={{ padding: "6px 8px", background: "#0a0a18", borderRadius: 6,
                    marginBottom: 4, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                    onClick={() => {
                      const next = data.findIndex(x => !x);
                      if (next !== -1) updateTop(which, next, r.id);
                    }}>
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
    </div>
  );
}
