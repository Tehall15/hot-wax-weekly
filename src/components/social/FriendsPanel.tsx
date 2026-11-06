import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import AvatarDisplay from "../avatar/AvatarDisplay";
import type { User } from "@supabase/supabase-js";
import type { Album, AppNotification, ProfileRow } from "../../types";
import { slugify, timeAgo } from "../../utils/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
      <span className="font-semibold text-primary">{n.from_display_name}</span>
    );
    if (n.type === "follow") return <>{name} started following you</>;
    if (n.type === "reaction") return <>{name} reacted to your review</>;
    if (n.type === "comment") return <>{name} commented on your review</>;
    if (n.type === "recommendation") {
      const alb = n.metadata?.album;
      return (
        <>
          {name} recommended{" "}
          <span className="font-semibold text-foreground">{alb?.album}</span>
          {alb?.artist ? ` by ${alb.artist}` : ""}
        </>
      );
    }
    return <span className="text-muted-foreground">{n.type}</span>;
  };

  const handleSectionChange = (value: string | null) => {
    if (!value) return;
    setActiveSection(value);
    if (value === "notifications") onNotificationsRead();
  };

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[320px] max-w-[calc(100%-2rem)] gap-0 border-border bg-background p-0 sm:max-w-[320px]">
        <SheetHeader className="gap-1 p-4 pr-12">
          <SheetTitle>Bandmates</SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 pt-0">
          <Tabs value={activeSection} onValueChange={handleSectionChange}>
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="notifications">
                Notifications
                {notifications.length > 0 ? ` (${notifications.length})` : ""}
              </TabsTrigger>
              <TabsTrigger value="friends">Find Friends</TabsTrigger>
            </TabsList>
          </Tabs>

          {activeSection === "notifications" && (
            <div>
              {(notifFeed || []).length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                <div className="flex flex-col gap-px">
                  {(notifFeed || []).map((n) => (
                    <div
                      key={n.id}
                      className={`rounded-lg border-l-2 px-3 py-2.5 ${n.read ? "border-l-transparent" : "border-l-destructive bg-card"}`}
                    >
                      <div className="text-[13px] leading-relaxed text-foreground/80">
                        {notifText(n)}
                      </div>
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        {timeAgo(n.created_at ?? "")}
                      </div>
                      {n.type === "recommendation" && n.metadata?.album && (
                        <div className="mt-2 flex gap-2">
                          <Button
                            size="xs"
                            onClick={() => {
                              addToThisWeek(n.metadata!.album!);
                              onClose();
                            }}
                          >
                            + This Week
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => addLL(n.metadata!.album!)}
                          >
                            + Listen Later
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === "friends" && (
            <div>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name…"
                className="mb-3 text-[13px]"
              />
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  {search ? "No users found" : "No other users yet"}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filteredUsers.map((u) => {
                    const isFollowing = following.includes(u.id);
                    return (
                      <div
                        key={u.id}
                        className="flex items-center justify-between gap-2"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <AvatarDisplay
                            avatar={u.data?.avatar}
                            name={u.display_name}
                            size={34}
                          />
                          <div className="min-w-0">
                            <div className="truncate text-[13px] font-semibold">
                              {u.display_name}
                            </div>
                            <a
                              href={`/u/${slugify(u.display_name)}`}
                              className="text-[11px] text-muted-foreground hover:text-foreground"
                            >
                              View profile →
                            </a>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={isFollowing ? "outline" : "default"}
                          className="shrink-0"
                          onClick={() =>
                            isFollowing ? unfollow(u.id) : follow(u.id)
                          }
                        >
                          {isFollowing ? "Following" : "Follow"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
