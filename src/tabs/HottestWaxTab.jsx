import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

function slugify(name) {
  return name?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "";
}

function StarDisplay({ value }) {
  return (
    <span>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= value ? "#F4C542" : "#2a2a2a", fontSize: 13 }}>★</span>
      ))}
    </span>
  );
}

function AlbumArt({ src, size = 52 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 6, overflow: "hidden",
      background: "#1a1a2e", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {src
        ? <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <span style={{ fontSize: size * 0.35, opacity: 0.3 }}>🎵</span>}
    </div>
  );
}

const card = { background: "#111122", border: "1px solid #1e1e3e", borderRadius: 12, padding: 18, marginTop: 14 };

export default function HottestWaxTab({ user }) {
  const [following, setFollowing] = useState([]);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("follows")
      .select("following_id")
      .eq("follower_id", user.id)
      .then(({ data }) => {
        const ids = (data || []).map(r => r.following_id);
        setFollowing(ids);
        if (ids.length === 0) { setLoading(false); return; }
        supabase.from("app_data")
          .select("id, display_name, data")
          .in("id", ids)
          .then(({ data: rows }) => {
            const items = [];
            (rows || []).forEach(row => {
              const reviews = row.data?.reviews || [];
              reviews.forEach(r => {
                items.push({ review: r, displayName: row.display_name, userId: row.id });
              });
            });
            items.sort((a, b) => new Date(b.review.reviewedAt) - new Date(a.review.reviewedAt));
            setFeed(items.slice(0, 60));
            setLoading(false);
          });
      });
  }, [user]);

  if (loading) return (
    <div style={{ ...card, textAlign: "center", padding: 40, color: "#444", fontSize: 13 }}>
      Loading…
    </div>
  );

  if (following.length === 0) return (
    <div style={{ ...card, textAlign: "center", padding: 40 }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
      <div style={{ color: "#555", fontSize: 13, marginBottom: 6 }}>No friends yet</div>
      <div style={{ color: "#333", fontSize: 12 }}>Tap the 💿 to find and follow friends</div>
    </div>
  );

  if (feed.length === 0) return (
    <div style={{ ...card, textAlign: "center", padding: 40, color: "#444", fontSize: 13 }}>
      Your friends haven't reviewed anything yet
    </div>
  );

  return (
    <div style={card}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "#555", marginBottom: 16 }}>
        Friends' Reviews
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {feed.map(({ review: r, displayName }, i) => (
          <div key={r.id} style={{ display: "flex", gap: 12, alignItems: "flex-start",
            padding: "14px 0",
            borderBottom: i < feed.length - 1 ? "1px solid #1a1a2e" : "none" }}>
            <AlbumArt src={r.image} size={52} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, overflow: "hidden",
                    textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.album}</div>
                  <div style={{ color: "#888", fontSize: 12 }}>{r.artist}
                    {r.year ? <span style={{ color: "#444" }}> · {r.year}</span> : null}
                  </div>
                </div>
                <div style={{ fontSize: 10, color: "#333", flexShrink: 0, marginLeft: 10 }}>
                  {new Date(r.reviewedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </div>
              </div>
              <div style={{ marginTop: 4 }}>
                <StarDisplay value={r.rating} />
              </div>
              {r.topTracks?.length > 0 && (
                <div style={{ marginTop: 5, display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {r.topTracks.map(t => (
                    <span key={t} style={{ fontSize: 10, color: "#F4C542",
                      background: "#1f1f0a", border: "1px solid #3a3a1a",
                      borderRadius: 10, padding: "2px 7px" }}>★ {t}</span>
                  ))}
                </div>
              )}
              {r.notes && (
                <div style={{ marginTop: 5, fontSize: 12, color: "#555",
                  fontStyle: "italic", lineHeight: 1.4 }}>"{r.notes}"</div>
              )}
              <div style={{ marginTop: 6 }}>
                <a href={`/u/${slugify(displayName)}`}
                  style={{ fontSize: 11, color: "#444", textDecoration: "none" }}>
                  {displayName}'s journal →
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
