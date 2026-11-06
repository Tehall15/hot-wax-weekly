import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import AlbumArt from "@/components/ui/AlbumArt";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Album, Review, Top4Item } from "@/types";
import { supabase } from "@/lib/supabase";
import { slugify } from "@/utils/format";

interface Profile {
  displayName: string | null;
  reviews: Review[];
  top4All: (Top4Item | string)[];
  top4Year: (Top4Item | string)[];
}

function StarDisplay({ value }: { value: number }) {
  return (
    <span className="text-[13px]" aria-label={`Rating: ${value} out of 10`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= value ? "text-primary" : "text-muted-foreground/30"}>
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
      <div className="mx-auto box-content flex h-screen min-h-screen max-w-[720px] items-center justify-center bg-background px-[14px] pb-[90px] text-foreground [font-family:Georgia,serif]">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );

  if (notFound)
    return (
      <div className="mx-auto box-content flex h-screen min-h-screen max-w-[720px] flex-col items-center justify-center bg-background px-[14px] pb-[90px] text-foreground [font-family:Georgia,serif]">
        <div className="text-center">
          <div className="mb-3 text-4xl" aria-hidden="true">🎵</div>
          <div className="text-sm text-muted-foreground">Profile not found</div>
          <a href="/" className="mt-4 block text-[13px] text-primary hover:underline">
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

  const cardClass = "mt-3.5 gap-0 rounded-xl border border-border bg-card p-[18px] text-card-foreground shadow-none ring-0";

  return (
    <div className="mx-auto box-content min-h-screen max-w-[720px] bg-background px-[14px] pb-[90px] text-foreground [font-family:Georgia,serif]">
      <header className="pt-7 text-center">
        <h1 className="m-0 text-[26px] font-bold">🔥 Hot Wax Weekly</h1>
        <p className="mt-1 mb-0 text-xs italic text-muted-foreground">{journalLabel}</p>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          {profile.reviews.length} album
          {profile.reviews.length !== 1 ? "s" : ""} reviewed
        </p>
        {currentUser && currentUser.id !== profileUserId && (
          <Button
            type="button"
            variant={isFollowing ? "outline" : "default"}
            onClick={isFollowing ? unfollow : follow}
            className="mt-2 rounded-lg px-5 py-[7px] text-[13px] font-semibold"
          >
            {isFollowing ? "Following" : "Follow"}
          </Button>
        )}
      </header>

      {top4Albums.length > 0 && (
        <Card className={cardClass}>
          <h2 className="mb-3.5 text-[11px] uppercase tracking-[2px] text-muted-foreground">
            All-time top 4
          </h2>
          <div className="grid grid-cols-4 gap-2.5">
            {top4Albums.map((r, i) => (
              <div key={i} className="text-center">
                <div className="relative inline-block">
                  <AlbumArt src={r.image} size={72} muted />
                  <div className="absolute -top-1.5 -left-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {i + 1}
                  </div>
                </div>
                <div className="mt-1.5 overflow-hidden text-[10px] font-bold text-ellipsis whitespace-nowrap">
                  {r.album}
                </div>
                <div className="overflow-hidden text-[9px] text-muted-foreground text-ellipsis whitespace-nowrap">
                  {r.artist}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {covers.length > 0 && (
        <Card className={cardClass}>
          <h2 className="mb-3 text-[11px] uppercase tracking-[2px] text-muted-foreground">
            Collection
          </h2>
          <div className="grid grid-cols-6 gap-1">
            {covers.map((r) => (
              <div
                key={r.id}
                title={`${r.artist} — ${r.album}`}
                className="aspect-square overflow-hidden rounded bg-muted"
              >
                <img src={r.image ?? undefined} alt={r.album} className="size-full object-cover" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {recentReviews.length > 0 && (
        <Card className={cardClass}>
          <h2 className="mb-3.5 text-[11px] uppercase tracking-[2px] text-muted-foreground">
            Recent reviews
          </h2>
          <div className="flex flex-col gap-3">
            {recentReviews.map((r) => (
              <div key={r.id} className="flex items-start gap-3">
                <AlbumArt src={r.image} size={48} muted />
                <div className="min-w-0 flex-1">
                  <div className="overflow-hidden text-sm font-bold text-ellipsis whitespace-nowrap">
                    {r.album}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {r.artist}
                    {r.year ? <span className="text-muted-foreground/60"> · {r.year}</span> : null}
                  </div>
                  <div className="mt-[3px]"><StarDisplay value={r.rating} /></div>
                  {r.topTracks?.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {r.topTracks.map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] text-primary"
                        >
                          ★ {t}
                        </span>
                      ))}
                    </div>
                  )}
                  {r.notes && (
                    <div className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      &quot;{r.notes}&quot;
                    </div>
                  )}
                </div>
                <div className="shrink-0 text-[10px] text-muted-foreground">
                  {new Date(r.reviewedAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <footer className="mt-[30px] text-center">
        <a href="/" className="text-[11px] text-muted-foreground hover:text-primary hover:underline">
          🔥 Start your own journal at Hot Wax Weekly
        </a>
      </footer>
    </div>
  );
}
