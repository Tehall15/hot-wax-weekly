import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import AvatarDisplay from "./AvatarDisplay";

export default function RecommendModal({ album, user, onClose }) {
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sent, setSent] = useState(new Set());

  useEffect(() => {
    if (!user) return;
    supabase.from("follows")
      .select("following_id")
      .eq("follower_id", user.id)
      .then(({ data }) => {
        const ids = (data || []).map(r => r.following_id);
        if (!ids.length) { setLoading(false); return; }
        supabase.from("app_data")
          .select("id, display_name, data")
          .in("id", ids)
          .then(({ data: rows }) => {
            setFollowing(rows || []);
            setLoading(false);
          });
      });
  }, [user]);

  const send = async (target) => {
    if (sent.has(target.id)) return;
    const dn = user.user_metadata?.display_name || "Someone";
    await supabase.from("notifications").insert({
      user_id: target.id,
      type: "recommendation",
      from_user_id: user.id,
      from_display_name: dn,
      metadata: {
        album: {
          artist: album.artist, album: album.album,
          image: album.image || null, year: album.year || null,
          spotifyId: album.spotifyId || null,
        },
      },
    });
    setSent(prev => new Set([...prev, target.id]));
  };

  return (
    <>
      <div onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", zIndex: 600 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        background: "#0d0d1a", border: "1px solid #1e1e3e", borderRadius: 14,
        zIndex: 700, width: 300, maxWidth: "92vw", padding: "20px 18px",
        boxShadow: "0 20px 60px rgba(0,0,0,.8)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Recommend to…</span>
          <button onClick={onClose}
            style={{ background: "none", border: "none", color: "#555", fontSize: 22, cursor: "pointer", padding: 0 }}>×</button>
        </div>
        <div style={{ fontSize: 12, color: "#555", marginBottom: 16, overflow: "hidden",
          textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {album.album} — {album.artist}
        </div>

        {loading ? (
          <div style={{ color: "#444", fontSize: 13, textAlign: "center", padding: "20px 0" }}>Loading…</div>
        ) : following.length === 0 ? (
          <div style={{ color: "#444", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
            Follow some bandmates first
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {following.map(u => (
              <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <AvatarDisplay avatar={u.data?.avatar} name={u.display_name} size={32} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {u.display_name}
                </span>
                <button onClick={() => send(u)} disabled={sent.has(u.id)}
                  style={{
                    background: sent.has(u.id) ? "transparent" : "#F4C542",
                    border: sent.has(u.id) ? "1px solid #2a2a4e" : "none",
                    borderRadius: 6, padding: "5px 14px", fontSize: 12, cursor: "pointer",
                    color: sent.has(u.id) ? "#555" : "#0d0d1a", fontWeight: 600, flexShrink: 0,
                  }}>
                  {sent.has(u.id) ? "Sent ✓" : "Send"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
