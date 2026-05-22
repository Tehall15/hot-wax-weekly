import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

function slugify(name) {
  return name?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "";
}

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function FriendsPanel({ user, notifications, onClose, onNotificationsRead }) {
  const [following, setFollowing] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  // Seed allNotifications with the already-working unread items from App.jsx
  const [allNotifications, setAllNotifications] = useState(notifications);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(notifications.length > 0 ? "notifications" : "friends");

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

    // Fetch historical (read=true) notifications and merge with the unread ones we already have
    supabase.from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .eq("read", true)
      .order("created_at", { ascending: false })
      .limit(49)
      .then(({ data }) => {
        setAllNotifications(prev => {
          const existingIds = new Set(prev.map(n => n.id));
          const newRead = (data || []).filter(n => !existingIds.has(n.id));
          return [...prev, ...newRead].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        });
      });
  }, [user]);

  // When App.jsx marks notifications as read (prop empties), update read flags locally
  useEffect(() => {
    if (notifications.length === 0) {
      setAllNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  }, [notifications.length]);

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

  const notifText = (n) => {
    const name = <span style={{ color: "#F4C542", fontWeight: 600 }}>{n.from_display_name}</span>;
    if (n.type === "follow") return <>{name} started following you</>;
    if (n.type === "reaction") return <>{name} reacted to your review</>;
    if (n.type === "comment") return <>{name} commented on your review</>;
    return <span style={{ color: "#666" }}>{n.type}</span>;
  };

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 400 }} />

      {/* Panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 320, maxWidth: "92vw",
        background: "#0d0d1a", borderLeft: "1px solid #1e1e3e",
        zIndex: 500, overflowY: "auto", padding: "24px 18px 40px",
        boxShadow: "-8px 0 40px rgba(0,0,0,.6)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>Bandmates</span>
          <button onClick={onClose}
            style={{ background: "none", border: "none", color: "#555", fontSize: 22,
              cursor: "pointer", lineHeight: 1, padding: 0 }}>×</button>
        </div>

        {/* Section toggle */}
        <div style={{ display: "flex", gap: 4, marginBottom: 18, background: "#0a0a18",
          borderRadius: 8, padding: 3 }}>
          {[["notifications", `Notifications${notifications.length > 0 ? ` (${notifications.length})` : ""}`],
            ["friends", "Find Friends"]].map(([id, label]) => (
            <button key={id} onClick={() => { setActiveSection(id); if (id === "notifications") onNotificationsRead(); }}
              style={{ flex: 1, padding: "6px 0", borderRadius: 6, border: "none", cursor: "pointer",
                fontSize: 11, fontWeight: 600,
                background: activeSection === id ? "#1a1a30" : "transparent",
                color: activeSection === id ? "#e0e0f0" : "#555" }}>
              {label}
            </button>
          ))}
        </div>

        {/* Notifications feed */}
        {activeSection === "notifications" && (
          <div>
            {allNotifications.length === 0 ? (
              <div style={{ color: "#444", fontSize: 13, textAlign: "center", padding: "30px 0" }}>
                No notifications yet
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {allNotifications.map(n => (
                  <div key={n.id} style={{
                    padding: "10px 12px", borderRadius: 8,
                    background: n.read ? "transparent" : "#111122",
                    borderLeft: n.read ? "2px solid transparent" : "2px solid #e53935",
                  }}>
                    <div style={{ fontSize: 13, color: "#ccc", lineHeight: 1.5 }}>{notifText(n)}</div>
                    <div style={{ fontSize: 10, color: "#444", marginTop: 3 }}>{timeAgo(n.created_at)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Find Friends */}
        {activeSection === "friends" && (
          <div>
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
        )}
      </div>
    </>
  );
}
