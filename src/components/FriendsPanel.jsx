import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

function slugify(name) {
  return name?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "";
}

export default function FriendsPanel({ user, notifications, onClose, onNotificationsRead }) {
  const [following, setFollowing] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("follows")
      .select("following_id")
      .eq("follower_id", user.id)
      .then(({ data }) => setFollowing((data || []).map(r => r.following_id)));
    supabase.from("app_data")
      .select("id, display_name")
      .not("display_name", "is", null)
      .then(({ data }) => {
        setAllUsers((data || []).filter(u => u.id !== user?.id && u.display_name));
        setLoading(false);
      });
  }, [user]);

  const follow = async (targetId) => {
    await supabase.from("follows").insert({ follower_id: user.id, following_id: targetId });
    const myName = user.user_metadata?.display_name || "Someone";
    await supabase.from("notifications").insert({
      user_id: targetId, type: "follow",
      from_user_id: user.id, from_display_name: myName,
    });
    setFollowing(prev => [...prev, targetId]);
  };

  const unfollow = async (targetId) => {
    await supabase.from("follows").delete()
      .eq("follower_id", user.id).eq("following_id", targetId);
    setFollowing(prev => prev.filter(id => id !== targetId));
  };

  const filteredUsers = allUsers.filter(u =>
    u.display_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 400 }}
      />

      {/* Panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 320, maxWidth: "92vw",
        background: "#0d0d1a", borderLeft: "1px solid #1e1e3e",
        zIndex: 500, overflowY: "auto", padding: "24px 18px 40px",
        boxShadow: "-8px 0 40px rgba(0,0,0,.6)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>Friends</span>
          <button onClick={onClose}
            style={{ background: "none", border: "none", color: "#555", fontSize: 22,
              cursor: "pointer", lineHeight: 1, padding: 0 }}>×</button>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div style={{ background: "#111122", border: "1px solid #1e1e3e", borderRadius: 10,
            padding: 14, marginBottom: 18 }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 2,
              color: "#555", marginBottom: 10 }}>Notifications</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {notifications.map(n => (
                <div key={n.id} style={{ fontSize: 13, color: "#ccc", lineHeight: 1.4 }}>
                  {n.type === "follow"
                    ? <><span style={{ color: "#F4C542", fontWeight: 600 }}>{n.from_display_name}</span> started following you</>
                    : n.type === "like"
                    ? <><span style={{ color: "#F4C542", fontWeight: 600 }}>{n.from_display_name}</span> liked your review</>
                    : <span style={{ color: "#888" }}>{n.type}</span>
                  }
                </div>
              ))}
            </div>
            <button onClick={onNotificationsRead}
              style={{ marginTop: 12, background: "none", border: "1px solid #2a2a4e",
                borderRadius: 6, padding: "5px 12px", color: "#555", fontSize: 11,
                cursor: "pointer" }}>
              Mark all read
            </button>
          </div>
        )}

        {/* Find Friends */}
        <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 2,
          color: "#555", marginBottom: 10 }}>Find Friends</div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name…"
          style={{ width: "100%", background: "#1a1a2e", border: "1px solid #2a2a4e", borderRadius: 8,
            padding: "9px 12px", color: "#e0e0f0", fontSize: 13, outline: "none",
            boxSizing: "border-box", marginBottom: 12 }}
        />

        {loading ? (
          <div style={{ color: "#444", fontSize: 13 }}>Loading…</div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ color: "#444", fontSize: 13 }}>
            {search ? "No users found" : "No other users yet"}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filteredUsers.map(u => {
              const isFollowing = following.includes(u.id);
              return (
                <div key={u.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#1a1a3e",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, color: "#F4C542", flexShrink: 0 }}>
                      {u.display_name[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{u.display_name}</div>
                      <a href={`/u/${slugify(u.display_name)}`}
                        style={{ fontSize: 11, color: "#444", textDecoration: "none" }}>
                        View profile →
                      </a>
                    </div>
                  </div>
                  <button
                    onClick={() => isFollowing ? unfollow(u.id) : follow(u.id)}
                    style={{ background: isFollowing ? "transparent" : "#F4C542",
                      border: isFollowing ? "1px solid #2a2a4e" : "none",
                      borderRadius: 6, padding: "5px 14px", fontSize: 12, cursor: "pointer",
                      color: isFollowing ? "#555" : "#0d0d1a", fontWeight: 600, flexShrink: 0 }}>
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
