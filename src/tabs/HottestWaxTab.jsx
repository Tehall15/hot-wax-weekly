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

const EMOJIS = ["🔥", "✨", "💿", "😮"];
const card = { background: "#111122", border: "1px solid #1e1e3e", borderRadius: 12, padding: 18, marginTop: 14 };

export default function HottestWaxTab({ user, reviews: ownReviews, addLL }) {
  const [friendItems, setFriendItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reactions, setReactions] = useState({});
  const [commentCounts, setCommentCounts] = useState({});
  const [openComments, setOpenComments] = useState({});
  const [comments, setComments] = useState({});
  const [commentInput, setCommentInput] = useState({});

  const displayName = user?.user_metadata?.display_name || "You";

  // Load friends' reviews
  useEffect(() => {
    if (!user) return;
    supabase.from("follows")
      .select("following_id")
      .eq("follower_id", user.id)
      .then(({ data }) => {
        const ids = (data || []).map(r => r.following_id);
        if (ids.length === 0) { setLoading(false); return; }
        supabase.from("app_data")
          .select("id, display_name, data")
          .in("id", ids)
          .then(({ data: rows }) => {
            const items = [];
            (rows || []).forEach(row => {
              (row.data?.reviews || []).forEach(r => {
                items.push({ review: r, displayName: row.display_name, userId: row.id, isMe: false });
              });
            });
            setFriendItems(items);
            setLoading(false);
          });
      });
  }, [user]);

  // Merge own + friend reviews into feed
  const ownItems = (ownReviews || []).map(r => ({ review: r, displayName, userId: user?.id, isMe: true }));
  const feed = [...ownItems, ...friendItems]
    .sort((a, b) => new Date(b.review.reviewedAt) - new Date(a.review.reviewedAt))
    .slice(0, 60);

  // Load reactions + comment counts once friends have loaded
  useEffect(() => {
    if (loading) return;
    const ids = [
      ...(ownReviews || []).map(r => r.id),
      ...friendItems.map(i => i.review.id),
    ].filter(Boolean);
    if (!ids.length) return;

    supabase.from("reactions").select("review_id, emoji, user_id").in("review_id", ids)
      .then(({ data }) => {
        const map = {};
        (data || []).forEach(r => {
          if (!map[r.review_id]) map[r.review_id] = {};
          if (!map[r.review_id][r.emoji]) map[r.review_id][r.emoji] = { count: 0, mine: false };
          map[r.review_id][r.emoji].count++;
          if (r.user_id === user.id) map[r.review_id][r.emoji].mine = true;
        });
        setReactions(map);
      });

    supabase.from("comments").select("review_id").in("review_id", ids)
      .then(({ data }) => {
        const map = {};
        (data || []).forEach(c => { map[c.review_id] = (map[c.review_id] || 0) + 1; });
        setCommentCounts(map);
      });
  }, [loading]);

  const toggleReaction = async (reviewId, emoji, reviewOwnerId) => {
    const isMine = reactions[reviewId]?.[emoji]?.mine;
    // Optimistic update
    setReactions(prev => ({
      ...prev,
      [reviewId]: {
        ...prev[reviewId],
        [emoji]: {
          count: isMine
            ? Math.max(0, (prev[reviewId]?.[emoji]?.count || 1) - 1)
            : (prev[reviewId]?.[emoji]?.count || 0) + 1,
          mine: !isMine,
        },
      },
    }));
    if (isMine) {
      await supabase.from("reactions").delete()
        .eq("review_id", reviewId).eq("user_id", user.id).eq("emoji", emoji);
    } else {
      const dn = user.user_metadata?.display_name || "Someone";
      await supabase.from("reactions")
        .insert({ review_id: reviewId, user_id: user.id, display_name: dn, emoji });
      if (reviewOwnerId && reviewOwnerId !== user.id) {
        await supabase.from("notifications").insert({
          user_id: reviewOwnerId, type: "reaction",
          from_user_id: user.id, from_display_name: dn,
        });
      }
    }
  };

  const toggleComments = async (reviewId) => {
    const isOpen = openComments[reviewId];
    setOpenComments(prev => ({ ...prev, [reviewId]: !isOpen }));
    if (!isOpen && !comments[reviewId]) {
      const { data } = await supabase.from("comments")
        .select("*").eq("review_id", reviewId)
        .order("created_at", { ascending: true });
      setComments(prev => ({ ...prev, [reviewId]: data || [] }));
    }
  };

  const deleteComment = async (reviewId, commentId) => {
    await supabase.from("comments").delete().eq("id", commentId);
    setComments(prev => ({
      ...prev,
      [reviewId]: (prev[reviewId] || []).filter(c => c.id !== commentId),
    }));
    setCommentCounts(prev => ({ ...prev, [reviewId]: Math.max(0, (prev[reviewId] || 1) - 1) }));
  };

  const submitComment = async (reviewId, reviewOwnerId) => {
    const body = (commentInput[reviewId] || "").trim();
    if (!body) return;
    const dn = user.user_metadata?.display_name || "Someone";
    const { data } = await supabase.from("comments")
      .insert({ review_id: reviewId, user_id: user.id, display_name: dn, body })
      .select().single();
    if (data) {
      setComments(prev => ({ ...prev, [reviewId]: [...(prev[reviewId] || []), data] }));
      setCommentCounts(prev => ({ ...prev, [reviewId]: (prev[reviewId] || 0) + 1 }));
      setCommentInput(prev => ({ ...prev, [reviewId]: "" }));
      if (reviewOwnerId && reviewOwnerId !== user.id) {
        await supabase.from("notifications").insert({
          user_id: reviewOwnerId, type: "comment",
          from_user_id: user.id, from_display_name: dn,
        });
      }
    }
  };

  if (loading && feed.length === 0) return (
    <div style={{ ...card, textAlign: "center", padding: 40, color: "#444", fontSize: 13 }}>Loading…</div>
  );

  if (!loading && feed.length === 0) return (
    <div style={{ ...card, textAlign: "center", padding: 40 }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🎵</div>
      <div style={{ color: "#555", fontSize: 13, marginBottom: 6 }}>No reviews yet</div>
      <div style={{ color: "#333", fontSize: 12 }}>Start with This Week, then find bandmates 💿</div>
    </div>
  );

  return (
    <div style={card}>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {feed.map(({ review: r, displayName: dn, userId, isMe }, i) => (
          <div key={r.id} style={{
            padding: "14px 0",
            borderBottom: i < feed.length - 1 ? "1px solid #1a1a2e" : "none"
          }}>
            {/* Reviewer header */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%",
                background: isMe ? "#1a1a2e" : "#1a1a3e", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, color: isMe ? "#555" : "#F4C542", fontWeight: 700 }}>
                {dn[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {isMe ? (
                  <span style={{ fontSize: 12, color: "#555", fontWeight: 600 }}>You</span>
                ) : (
                  <a href={`/u/${slugify(dn)}`}
                    style={{ fontSize: 12, color: "#F4C542", fontWeight: 600, textDecoration: "none" }}>
                    {dn}
                  </a>
                )}
              </div>
              <div style={{ fontSize: 10, color: "#333", flexShrink: 0 }}>
                {new Date(r.reviewedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <AlbumArt src={r.image} size={52} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, overflow: "hidden",
                    textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.album}</div>
                  <div style={{ color: "#888", fontSize: 12 }}>{r.artist}
                    {r.year ? <span style={{ color: "#444" }}> · {r.year}</span> : null}
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

                {/* Reaction bar */}
                <div style={{ display: "flex", gap: 5, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
                  {EMOJIS.map(emoji => {
                    const rx = reactions[r.id]?.[emoji];
                    const count = rx?.count || 0;
                    const mine = rx?.mine || false;
                    return (
                      <button key={emoji} onClick={() => toggleReaction(r.id, emoji, userId)}
                        style={{ background: mine ? "#2a2000" : "#0f0f1a",
                          border: `1px solid ${mine ? "#F4C542" : "#2a2a3e"}`,
                          borderRadius: 20, padding: "3px 8px", cursor: "pointer",
                          fontSize: 12, color: mine ? "#F4C542" : "#555",
                          display: "flex", alignItems: "center", gap: 3, transition: "all .15s" }}>
                        <span>{emoji}</span>
                        {count > 0 && <span style={{ fontSize: 10, fontWeight: 600 }}>{count}</span>}
                      </button>
                    );
                  })}
                  <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
                    {!isMe && addLL && (
                      <button
                        onClick={() => addLL({ artist: r.artist, album: r.album,
                          image: r.image, year: r.year, spotifyId: r.spotifyId })}
                        style={{ background: "none", border: "none", color: "#555",
                          cursor: "pointer", fontSize: 11, padding: 0 }}>
                        + Later
                      </button>
                    )}
                    <button onClick={() => toggleComments(r.id)}
                      style={{ background: "none", border: "none",
                        color: openComments[r.id] ? "#aaa" : "#555",
                        cursor: "pointer", fontSize: 11, padding: 0 }}>
                      💬 {commentCounts[r.id] || 0}
                    </button>
                  </div>
                </div>

                {/* Comments section */}
                {openComments[r.id] && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #1a1a2e" }}>
                    {!comments[r.id] ? (
                      <div style={{ fontSize: 11, color: "#444" }}>Loading…</div>
                    ) : comments[r.id].length === 0 ? (
                      <div style={{ fontSize: 11, color: "#444", marginBottom: 8 }}>No comments yet</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 10 }}>
                        {comments[r.id].map(c => (
                          <div key={c.id} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                            <div style={{ flex: 1 }}>
                              <span style={{ fontSize: 11, color: "#F4C542", fontWeight: 600 }}>{c.display_name} </span>
                              <span style={{ fontSize: 12, color: "#aaa" }}>{c.body}</span>
                            </div>
                            {(c.user_id === user.id || isMe) && (
                              <button onClick={() => deleteComment(r.id, c.id)}
                                style={{ background: "none", border: "none", color: "#444",
                                  cursor: "pointer", fontSize: 14, lineHeight: 1,
                                  padding: 0, flexShrink: 0 }}>×</button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 6 }}>
                      <input
                        value={commentInput[r.id] || ""}
                        onChange={e => setCommentInput(prev => ({ ...prev, [r.id]: e.target.value }))}
                        onKeyDown={e => e.key === "Enter" && submitComment(r.id, userId)}
                        placeholder="Add a comment…"
                        style={{ flex: 1, background: "#0f0f1a", border: "1px solid #2a2a3e",
                          borderRadius: 6, padding: "6px 10px", color: "#e0e0f0",
                          fontSize: 12, outline: "none" }}
                      />
                      <button onClick={() => submitComment(r.id, userId)}
                        style={{ background: "#F4C542", border: "none", borderRadius: 6,
                          padding: "6px 12px", color: "#0d0d1a", fontWeight: 700,
                          fontSize: 12, cursor: "pointer" }}>→</button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
