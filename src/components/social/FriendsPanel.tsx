import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import AvatarDisplay from "../avatar/AvatarDisplay";
import type { User } from "@supabase/supabase-js";
import type { Album, AppNotification, ProfileRow } from "../../types";
import { slugify, timeAgo } from "../../utils/format";
import { Modal } from "../ui";
import styles from "./FriendsPanel.module.css";

export default function FriendsPanel({
  user,
  notifications,
  notifFeed,
  onClose,
  onNotificationsRead,
  addLL,
  addToThisWeek,
}: {
  user: User | null;
  notifications: AppNotification[];
  notifFeed: AppNotification[];
  onClose: () => void;
  onNotificationsRead: () => void;
  addLL: (album: Album) => void;
  addToThisWeek: (album: Album) => void;
}) {
  const [following, setFollowing] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<ProfileRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(
    notifications.length > 0 ? "notifications" : "friends",
  );

  useEffect(() => {
    if (!user) return;
    supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id)
      .then(({ data }) =>
        setFollowing((data || []).map((r) => r.following_id)),
      );

    supabase
      .from("app_data")
      .select("id, display_name, data")
      .not("display_name", "is", null)
      .then(({ data }) => {
        setAllUsers(
          (data || []).filter((u) => u.id !== user?.id && u.display_name),
        );
        setLoading(false);
      });
  }, [user]);

  const follow = async (targetId: string) => {
    if (!user) return;
    await supabase
      .from("follows")
      .insert({ follower_id: user.id, following_id: targetId });
    const myName = user.user_metadata?.display_name || "Someone";
    await supabase.from("notifications").insert({
      user_id: targetId,
      type: "follow",
      from_user_id: user.id,
      from_display_name: myName,
    });
    setFollowing((prev) => [...prev, targetId]);
  };

  const unfollow = async (targetId: string) => {
    if (!user) return;
    await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", targetId);
    setFollowing((prev) => prev.filter((id) => id !== targetId));
  };

  const filteredUsers = allUsers.filter((u) =>
    u.display_name?.toLowerCase().includes(search.toLowerCase()),
  );

  const notifText = (n: AppNotification) => {
    const name = (
      <span className={styles.name}>
        {n.from_display_name}
      </span>
    );
    if (n.type === "follow") return <>{name} started following you</>;
    if (n.type === "reaction") return <>{name} reacted to your review</>;
    if (n.type === "comment") return <>{name} commented on your review</>;
    if (n.type === "recommendation") {
      const alb = n.metadata?.album;
      return (
        <>
          {name} recommended{" "}
          <span className={styles.albumName}>
            {alb?.album}
          </span>
          {alb?.artist ? ` by ${alb.artist}` : ""}
        </>
      );
    }
    return <span className={styles.notificationType}>{n.type}</span>;
  };

  return (
    <Modal title="Bandmates" onClose={onClose} variant="drawer" width={320} headerGap={18}>
        {/* Section toggle */}
        <div
          className={styles.tabs}
        >
          {[
            [
              "notifications",
              `Notifications${notifications.length > 0 ? ` (${notifications.length})` : ""}`,
            ],
            ["friends", "Find Friends"],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => {
                setActiveSection(id);
                if (id === "notifications") onNotificationsRead();
              }}
              className={`${styles.tab} ${activeSection === id ? styles.activeTab : ""}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Notifications feed */}
        {activeSection === "notifications" && (
          <div>
            {(notifFeed || []).length === 0 ? (
              <div
                className={styles.emptyCentered}
              >
                No notifications yet
              </div>
            ) : (
              <div className={styles.notificationList}>
                {(notifFeed || []).map((n) => (
                  <div
                    key={n.id}
                    className={`${styles.notification} ${n.read ? "" : styles.unread}`}
                  >
                    <div
                      className={styles.notificationText}
                    >
                      {notifText(n)}
                    </div>
                    <div className={styles.timestamp}>
                      {timeAgo(n.created_at ?? "")}
                    </div>
                    {n.type === "recommendation" && n.metadata?.album && (
                      <div className={styles.notificationActions}>
                        <button
                          onClick={() => {
                            addToThisWeek(n.metadata!.album!);
                            onClose();
                          }}
                          className={styles.weekButton}
                        >
                          + This Week
                        </button>
                        <button
                          onClick={() => addLL(n.metadata!.album!)}
                          className={styles.listenLaterButton}
                        >
                          + Listen Later
                        </button>
                      </div>
                    )}
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name…"
              className={styles.search}
            />
            {loading ? (
              <div className={styles.empty}>Loading…</div>
            ) : filteredUsers.length === 0 ? (
              <div className={styles.empty}>
                {search ? "No users found" : "No other users yet"}
              </div>
            ) : (
              <div className={styles.userList}>
                {filteredUsers.map((u) => {
                  const isFollowing = following.includes(u.id);
                  return (
                    <div
                      key={u.id}
                      className={styles.userRow}
                    >
                      <div
                        className={styles.userIdentity}
                      >
                        <AvatarDisplay
                          avatar={u.data?.avatar}
                          name={u.display_name}
                          size={34}
                        />
                        <div>
                          <div className={styles.userName}>
                            {u.display_name}
                          </div>
                          <a
                            href={`/u/${slugify(u.display_name)}`}
                            className={styles.profileLink}
                          >
                            View profile →
                          </a>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          isFollowing ? unfollow(u.id) : follow(u.id)
                        }
                        className={`${styles.followButton} ${isFollowing ? styles.following : ""}`}
                      >
                        {isFollowing ? "Following" : "Follow"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
    </Modal>
  );
}
