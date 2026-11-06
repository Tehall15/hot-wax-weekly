import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { AlbumArt } from "../components/ui";
import type { Album, Review, Top4Item } from "../types";
import { slugify } from "../utils/format";
import styles from "./PublicProfile.module.css";

interface Profile {
  displayName: string | null;
  reviews: Review[];
  top4All: (Top4Item | string)[];
  top4Year: (Top4Item | string)[];
}

function StarDisplay({ value }: { value: number }) {
  return (
    <span className={styles.stars}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= value ? styles.starActive : styles.star}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function PublicProfile({ slug }: { slug: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setCurrentUser(data.session?.user ?? null);
    });
  }, []);

  useEffect(() => {
    if (!currentUser || !profileUserId) return;
    supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", currentUser.id)
      .eq("following_id", profileUserId)
      .maybeSingle()
      .then(({ data }) => setIsFollowing(!!data));
  }, [currentUser, profileUserId]);

  const follow = async () => {
    if (!currentUser || !profileUserId) return;
    await supabase
      .from("follows")
      .insert({ follower_id: currentUser.id, following_id: profileUserId });
    const myName = currentUser.user_metadata?.display_name || "Someone";
    await supabase.from("notifications").insert({
      user_id: profileUserId,
      type: "follow",
      from_user_id: currentUser.id,
      from_display_name: myName,
    });
    setIsFollowing(true);
  };

  const unfollow = async () => {
    if (!currentUser || !profileUserId) return;
    await supabase
      .from("follows")
      .delete()
      .eq("follower_id", currentUser.id)
      .eq("following_id", profileUserId);
    setIsFollowing(false);
  };

  useEffect(() => {
    supabase
      .from("app_data")
      .select("id, display_name, data")
      .then(({ data: rows, error }) => {
        if (error) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        const match = (rows || []).find(
          (r) => slugify(r.display_name) === slug,
        );
        if (!match) {
          setNotFound(true);
          setLoading(false);
          return;
        }
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
      .then(undefined, () => {
        setNotFound(true);
        setLoading(false);
      });
  }, [slug]);

  if (loading)
    return (
      <div className={`${styles.profilePage} ${styles.statePage}`}>
        <div className={styles.loading}>Loading…</div>
      </div>
    );

  if (notFound)
    return (
      <div className={`${styles.profilePage} ${styles.statePage}`}>
        <div className={styles.notFound}>
          <div className={styles.notFoundIcon}>🎵</div>
          <div className={styles.notFoundText}>Profile not found</div>
          <a href="/" className={styles.homeLink}>
            ← Hot Wax Weekly
          </a>
        </div>
      </div>
    );

  if (!profile) return null;

  const journalLabel = profile.displayName
    ? `${profile.displayName}${profile.displayName.endsWith("s") ? "'" : "'s"} album journal`
    : "album journal";

  const recentReviews = [...profile.reviews]
    .sort(
      (a, b) =>
        new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime(),
    )
    .slice(0, 20);

  // top4All can be album objects (new) or review ID strings (old)
  const top4Albums = profile.top4All
    .map((item): Album | null => {
      if (!item) return null;
      if (typeof item === "object") return item;
      const r = profile.reviews.find((x) => x.id === item);
      return r ? { artist: r.artist, album: r.album, image: r.image } : null;
    })
    .filter((a): a is Album => a !== null);

  const covers = [...profile.reviews]
    .filter((r) => r.image)
    .sort(
      (a, b) =>
        new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime(),
    )
    .slice(0, 24);

  return (
    <div className={styles.profilePage}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.brand}>🔥 Hot Wax Weekly</h1>
        <p className={styles.journalLabel}>{journalLabel}</p>
        <p className={styles.reviewCount}>
          {profile.reviews.length} album
          {profile.reviews.length !== 1 ? "s" : ""} reviewed
        </p>
        {currentUser && currentUser.id !== profileUserId && (
          <button
            onClick={isFollowing ? unfollow : follow}
            className={`${styles.followButton} ${isFollowing ? styles.following : styles.notFollowing}`}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        )}
      </div>

      {/* Top 4 */}
      {top4Albums.length > 0 && (
        <div className={styles.card}>
          <div className={styles.sectionTitle}>All-time top 4</div>
          <div className={styles.topFourGrid}>
            {top4Albums.map((r, i) => (
              <div key={i} className={styles.topAlbum}>
                <div className={styles.coverWithRank}>
                  <AlbumArt src={r.image} size={72} muted />
                  <div className={styles.rank}>{i + 1}</div>
                </div>
                <div className={styles.albumTitle}>{r.album}</div>
                <div className={styles.albumArtist}>{r.artist}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cover wall */}
      {covers.length > 0 && (
        <div className={styles.card}>
          <div className={styles.collectionTitle}>Collection</div>
          <div className={styles.coverGrid}>
            {covers.map((r) => (
              <div
                key={r.id}
                title={`${r.artist} — ${r.album}`}
                className={styles.cover}
              >
                <img src={r.image ?? undefined} alt={r.album} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent reviews */}
      {recentReviews.length > 0 && (
        <div className={styles.card}>
          <div className={styles.sectionTitle}>Recent reviews</div>
          <div className={styles.reviewList}>
            {recentReviews.map((r) => (
              <div key={r.id} className={styles.review}>
                <AlbumArt src={r.image} size={48} muted />
                <div className={styles.reviewContent}>
                  <div className={styles.reviewAlbum}>{r.album}</div>
                  <div className={styles.reviewArtist}>
                    {r.artist}
                    {r.year ? (
                      <span className={styles.reviewYear}> · {r.year}</span>
                    ) : null}
                  </div>
                  <div className={styles.rating}>
                    <StarDisplay value={r.rating} />
                  </div>
                  {r.topTracks?.length > 0 && (
                    <div className={styles.topTracks}>
                      {r.topTracks.map((t) => (
                        <span key={t} className={styles.track}>
                          ★ {t}
                        </span>
                      ))}
                    </div>
                  )}
                  {r.notes && <div className={styles.notes}>"{r.notes}"</div>}
                </div>
                <div className={styles.reviewDate}>
                  {new Date(r.reviewedAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.footer}>
        <a href="/" className={styles.footerLink}>
          🔥 Start your own journal at Hot Wax Weekly
        </a>
      </div>
    </div>
  );
}
