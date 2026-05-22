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

export default function FriendsTab({ user }) {
  const [following, setFollowing] = useState([]);   // list of following_id strings
  const [feed, setFeed] = useState([]);             // { review, displayName, userId }
  const [allUsers, setAllUsers] = useState([]);     // { id, display_name }
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Load who I follow
  useEffect(() => {
    if (!user) return;
    supabase.from("follows")
      .select("following_id")
      .eq("follower_id", user.id)
      .then(({ data }) => setFollowing((data || []).map(r => r.following_id)));
  }, [user]);

  // Load all users for discovery
  useEffect(() => {
    supabase.from("app_data")
      .select("id, display_name")
      .not("display_name", "is", null)
      .then(({ data }) => {
        setAllUsers((data || []).filter(u => u.id !== user?.id && u.display_name));
        setLoading(false);
      });
  }, [user]);

  // Load feed when following list changes
  useEffect(() => {
    if (following.length === 0) { setFeed([]); return; }
    supabase.from("app_data")
      .select("id, display_name, data")
      .in("id", following)
      .then(({ data: rows }) => {
        const items = [];
        (rows || []).forEach(row => {
          const reviews = row.data?.reviews || [];
          reviews.forEach(r => {
            items.push({ review: r, displayName: row.display_name, userId: row.id });
          });
        });
        items.sort((a, b) => new Date(b.review.reviewedAt) - new Date(a.review.reviewedAt));
        setFeed(items.slice(0, 40));
      });
  }, [following]);

  const follow = async (targetId) => {
    await supabase.from("follows").insert({ follower_id: user.id, following_id: targetId });
    // Create notification for the followed user
    const myName = user.user_metadata?.display_name || "Someone";
    await supabase.from("notifications").insert({
      user_id: targetId,
      type: "follow",
      from_user_id: user.id,
      from_display_name: myName,
    });
    setFollowing(prev => [...prev, targetId]);
  };

  const unfollow = async (targetId) => {
    await supabase.from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", targetId);
    setFollowing(prev => prev.filter(id => id !== targetId));
  };

  const card = { background: "#111122", border: "1px solid #1e1e3e", borderRadius: 12, padding: 18, marginTop: 14 };

  const filteredUsers = allUsers.filter(u =>
    u.display_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Find Friends */}
      <div style={card}>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "#555", marginBottom: 12 }}>
          Find Friends
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name…"
          style={{ width: "100%", background: "#1a1a2e", border: "1px solid #2a2a4e", borderRadius: 8,
            padding: "9px 12px", color: "#e0e0f0", fontSize: 13, outline: "none", boxSizing: "border-box",
            marginBottom: 12 }}
        />
        {loading ? (
          <div style={{ color: "#444", fontSize: 13 }}>Loading…</div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ color: "#444", fontSize: 13 }}>
            {search ? "No users found" : "No other users yet"}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filteredUsers.map(u => {
              const isFollowing = following.includes(u.id);
              return (
                <div key={u.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1a1a3e",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, color: "#F4C542" }}>
                      {u.display_name[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{u.display_name}</div>
                      <a href={`/u/${slugify(u.display_name)}`}
                        style={{ fontSize: 11, color: "#555", textDecoration: "none" }}>
                        View profile →
                      </a>
                    </div>
                  </div>
                  <button
                    onClick={() => isFollowing ? unfollow(u.id) : follow(u.id)}
                    style={{ background: isFollowing ? "transparent" : "#F4C542",
                      border: isFollowing ? "1px solid #333" : "none",
                      borderRadius: 6, padding: "5px 14px", fontSize: 12, cursor: "pointer",
                      color: isFollowing ? "#555" : "#0d0d1a", fontWeight: 600 }}>
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Feed */}
      <div style={card}>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "#555", marginBottom: 14 }}>
          Friends' Reviews
        </div>
        {following.length === 0 ? (
          <div style={{ color: "#444", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
            Follow some friends to see their reviews here
          </div>
        ) : feed.length === 0 ? (
          <div style={{ color: "#444", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
            No reviews yet from people you follow
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {feed.map(({ review: r, displayName, userId }) => (
              <div key={r.id} style={{ display: "flex", gap: 12, alignItems: "flex-start",
                paddingBottom: 16, borderBottom: "1px solid #1a1a2e" }}>
                <AlbumArt src={r.image} size={52} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{r.album}</div>
                      <div style={{ color: "#888", fontSize: 12 }}>{r.artist}
                        {r.year ? <span style={{ color: "#444" }}> · {r.year}</span> : null}
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: "#333", flexShrink: 0, marginLeft: 8 }}>
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
                  <div style={{ marginTop: 6 }}>
                    <a href={`/u/${slugify(displayName)}`}
                      style={{ fontSize: 11, color: "#555", textDecoration: "none" }}>
                      {displayName}'s journal →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
