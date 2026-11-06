import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import AvatarDisplay from "../avatar/AvatarDisplay";
import { Modal } from "../ui";
import styles from "./RecommendModal.module.css";
import type { User } from "@supabase/supabase-js";
import type { Album, AppDataRow } from "../../types";

export default function RecommendModal({
  album,
  user,
  onClose,
}: {
  album: Album;
  user: User | null;
  onClose: () => void;
}) {
  const [following, setFollowing] = useState<
    Pick<AppDataRow, "id" | "display_name" | "data">[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [sent, setSent] = useState(new Set<string>());

  useEffect(() => {
    if (!user) return;
    supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id)
      .then(({ data }) => {
        const ids = (data || []).map((r) => r.following_id);
        if (!ids.length) {
          setLoading(false);
          return;
        }
        supabase
          .from("app_data")
          .select("id, display_name, data")
          .in("id", ids)
          .then(({ data: rows }) => {
            setFollowing(rows || []);
            setLoading(false);
          });
      });
  }, [user]);

  const send = async (target: Pick<AppDataRow, "id">) => {
    if (!user || sent.has(target.id)) return;
    const dn = user.user_metadata?.display_name || "Someone";
    await supabase.from("notifications").insert({
      user_id: target.id,
      type: "recommendation",
      from_user_id: user.id,
      from_display_name: dn,
      metadata: {
        album: {
          artist: album.artist,
          album: album.album,
          image: album.image || null,
          year: album.year || null,
          spotifyId: album.spotifyId || null,
        },
      },
    });
    setSent((prev) => new Set([...prev, target.id]));
  };

  return (
    <Modal title="Recommend to…" onClose={onClose} variant="dialog" width={300} headerGap={4}>
        <div className={styles.albumSubtitle}>
          {album.album} — {album.artist}
        </div>

        {loading ? (
          <div className={styles.centeredMessage}>
            Loading…
          </div>
        ) : following.length === 0 ? (
          <div className={styles.centeredMessage}>
            Follow some bandmates first
          </div>
        ) : (
          <div className={styles.followingList}>
            {following.map((u) => (
              <div
                key={u.id}
                className={styles.followingRow}
              >
                <AvatarDisplay
                  avatar={u.data?.avatar}
                  name={u.display_name}
                  size={32}
                />
                <span
                  className={styles.displayName}
                >
                  {u.display_name}
                </span>
                <button
                  onClick={() => send(u)}
                  disabled={sent.has(u.id)}
                  className={`${styles.sendButton} ${sent.has(u.id) ? styles.sent : ""}`}
                >
                  {sent.has(u.id) ? "Sent ✓" : "Send"}
                </button>
              </div>
            ))}
          </div>
        )}
    </Modal>
  );
}
