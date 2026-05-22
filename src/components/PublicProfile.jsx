import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

function slugify(name) {
  return name?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "";
}

function StarDisplay({ value }) {
  return (
    <span>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= value ? "#F4C542" : "#333", fontSize: 13 }}>★</span>
      ))}
    </span>
  );
}

function AlbumArt({ src, size = 48 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 6, overflow: "hidden",
      background: "#1a1a2e", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {src
        ? <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <span style={{ fontSize: size * 0.4, opacity: 0.3 }}>🎵</span>}
    </div>
  );
}

export default function PublicProfile({ slug }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [profileUserId, setProfileUserId] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setCurrentUser(data.session?.user ?? null);
    });
  }, []);

  useEffect(() => {
    if (!currentUser || !profileUserId) return;
    supabase.from("follows")
      .select("follower_id")
      .eq("follower_id", currentUser.id)
      .eq("following_id", profileUserId)
      .maybeSingle()
      .then(({ data }) => setIsFollowing(!!data));
  }, [currentUser, profileUserId]);

  const follow = async () => {
    if (!currentUser) return;
    await supabase.from("follows").insert({ follower_id: currentUser.id, following_id: profileUserId });
    const myName = currentUser.user_metadata?.display_name || "Someone";
    await supabase.from("notifications").insert({
      user_id: profileUserId, type: "follow",
      from_user_id: currentUser.id, from_display_name: myName,
    });
    setIsFollowing(true);
  };

  const unfollow = async () => {
    if (!currentUser) return;
    await supabase.from("follows").delete()
      .eq("follower_id", currentUser.id).eq("following_id", profileUserId);
    setIsFollowing(false);
  };

  useEffect(() => {
    supabase
      .from("app_data")
      .select("id, display_name, data")
      .then(({ data: rows, error }) => {
        if (error) { setNotFound(true); setLoading(false); return; }
        const match = (rows || []).find(r => slugify(r.display_name) === slug);
        if (!match) { setNotFound(true); setLoading(false); return; }
        const d = match.data || {};
        setProfileUserId(match.id);
        setProfile({
          displayName: match.display_name,
          reviews: d.reviews || [],
          top4All: d.top4All || [],
          top4Year: d.top4Year || [],
        });
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [slug]);

  const S = {
    page: { background: "#0d0d1a", minHeight: "100vh", color: "#e0e0f0",
      fontFamily: "Georgia,serif", maxWidth: 720, margin: "0 auto", padding: "0 14px 90px" },
    card: { background: "#111122", border: "1px solid #1e1e3e", borderRadius: 12, padding: 18, marginTop: 14 },
  };

  if (loading) return (
    <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <div style={{ color: "#444", fontSize: 14 }}>Loading…</div>
    </div>
  );

  if (notFound) return (
    <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🎵</div>
        <div style={{ color: "#666", fontSize: 14 }}>Profile not found</div>
        <a href="/" style={{ display: "block", marginTop: 16, color: "#F4C542", fontSize: 13 }}>
          ← Hot Wax Weekly
        </a>
      </div>
    </div>
  );

  const journalLabel = profile.displayName
    ? `${profile.displayName}${profile.displayName.endsWith("s") ? "'" : "'s"} album journal`
    : "album journal";

  const recentReviews = [...profile.reviews]
    .sort((a, b) => new Date(b.reviewedAt) - new Date(a.reviewedAt))
    .slice(0, 20);

  const top4Reviews = profile.top4All
    .map(id => profile.reviews.find(r => r.id === id))
    .filter(Boolean);

  const covers = [...profile.reviews]
    .filter(r => r.image)
    .sort((a, b) => new Date(b.reviewedAt) - new Date(a.reviewedAt))
    .slice(0, 24);

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ paddingTop: 28, textAlign: "center" }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>🔥 Hot Wax Weekly</h1>
        <p style={{ color: "#555", fontSize: 12, marginTop: 4, marginBottom: 0, fontStyle: "italic" }}>
          {journalLabel}
        </p>
        <p style={{ color: "#333", fontSize: 11, marginTop: 6 }}>
          {profile.reviews.length} album{profile.reviews.length !== 1 ? "s" : ""} reviewed
        </p>
        {currentUser && currentUser.id !== profileUserId && (
          <button
            onClick={isFollowing ? unfollow : follow}
            style={{ marginTop: 8, background: isFollowing ? "transparent" : "#F4C542",
              border: isFollowing ? "1px solid #333" : "none",
              borderRadius: 8, padding: "7px 20px", fontSize: 13, cursor: "pointer",
              color: isFollowing ? "#555" : "#0d0d1a", fontWeight: 600 }}>
            {isFollowing ? "Following" : "Follow"}
          </button>
        )}
      </div>

      {/* Top 4 */}
      {top4Reviews.length > 0 && (
        <div style={S.card}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2,
            color: "#555", marginBottom: 14 }}>All-time top 4</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {top4Reviews.map((r, i) => (
              <div key={r.id} style={{ textAlign: "center" }}>
                <div style={{ position: "relative", display: "inline-block" }}>
                  <AlbumArt src={r.image} size={72} />
                  <div style={{ position: "absolute", top: -6, left: -6, width: 20, height: 20,
                    background: "#F4C542", borderRadius: "50%", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 700, color: "#0d0d1a" }}>{i + 1}</div>
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, marginTop: 6,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.album}</div>
                <div style={{ fontSize: 9, color: "#666", overflow: "hidden",
                  textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.artist}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cover wall */}
      {covers.length > 0 && (
        <div style={S.card}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2,
            color: "#555", marginBottom: 12 }}>Collection</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4 }}>
            {covers.map(r => (
              <div key={r.id} title={`${r.artist} — ${r.album}`}
                style={{ aspectRatio: "1", borderRadius: 4, overflow: "hidden", background: "#1a1a2e" }}>
                <img src={r.image} alt={r.album}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent reviews */}
      {recentReviews.length > 0 && (
        <div style={S.card}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2,
            color: "#555", marginBottom: 14 }}>Recent reviews</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {recentReviews.map(r => (
              <div key={r.id} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <AlbumArt src={r.image} size={48} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, overflow: "hidden",
                    textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.album}</div>
                  <div style={{ color: "#888", fontSize: 12 }}>{r.artist}
                    {r.year ? <span style={{ color: "#444" }}> · {r.year}</span> : null}
                  </div>
                  <div style={{ marginTop: 3 }}>
                    <StarDisplay value={r.rating} />
                  </div>
                  {r.topTracks?.length > 0 && (
                    <div style={{ marginTop: 4, display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {r.topTracks.map(t => (
                        <span key={t} style={{ fontSize: 10, color: "#F4C542",
                          background: "#1f1f0a", border: "1px solid #3a3a1a",
                          borderRadius: 10, padding: "2px 7px" }}>★ {t}</span>
                      ))}
                    </div>
                  )}
                  {r.notes && (
                    <div style={{ marginTop: 5, fontSize: 12, color: "#666",
                      fontStyle: "italic", lineHeight: 1.4 }}>"{r.notes}"</div>
                  )}
                </div>
                <div style={{ fontSize: 10, color: "#333", flexShrink: 0 }}>
                  {new Date(r.reviewedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: 30 }}>
        <a href="/" style={{ color: "#333", fontSize: 11, textDecoration: "none" }}>
          🔥 Start your own journal at Hot Wax Weekly
        </a>
      </div>
    </div>
  );
}
