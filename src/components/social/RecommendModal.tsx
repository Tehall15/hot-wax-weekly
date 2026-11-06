import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import AvatarDisplay from "../avatar/AvatarDisplay";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[300px] max-w-[calc(100%-2rem)] gap-4">
        <DialogHeader className="pr-6">
          <DialogTitle>Recommend to…</DialogTitle>
        </DialogHeader>
        <div className="mb-1 truncate text-xs text-muted-foreground">
          {album.album} — {album.artist}
        </div>

        {loading ? (
          <div className="py-5 text-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : following.length === 0 ? (
          <div className="py-5 text-center text-sm text-muted-foreground">
            Follow some bandmates first
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {following.map((u) => {
              const hasSent = sent.has(u.id);
              return (
                <div key={u.id} className="flex items-center gap-2.5">
                  <AvatarDisplay
                    avatar={u.data?.avatar}
                    name={u.display_name}
                    size={32}
                  />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">
                    {u.display_name}
                  </span>
                  <Button
                    size="sm"
                    variant={hasSent ? "outline" : "default"}
                    className="shrink-0"
                    onClick={() => send(u)}
                    disabled={hasSent}
                  >
                    {hasSent ? "Sent ✓" : "Send"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
