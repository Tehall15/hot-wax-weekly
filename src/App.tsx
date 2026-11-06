import { useState, useEffect, useRef } from "react";
import type { KeyboardEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import useSpotify from "./hooks/useSpotify";
import { EMPTY, buildSlotsFromReviews } from "./utils/slots";
import { RS500 } from "./utils/data";
import { NOW_YEAR, getWeekKey, shiftWeekKey } from "./utils/time";
import AuthScreen from "./pages/AuthScreen";
import FriendsPanel from "./components/social/FriendsPanel";
import AvatarPicker from "./components/avatar/AvatarPicker";
import ReviewTab from "./tabs/ReviewTab";
import HistoryTab from "./tabs/HistoryTab";
import CollectionTab from "./tabs/CollectionTab";
import HottestWaxTab from "./tabs/HottestWaxTab";
import ListenLaterTab from "./tabs/ListenLaterTab";
import type {
  Album,
  AppNotification,
  ListenLaterItem,
  Review,
  Slot,
  SlotField,
  Top4,
} from "./types";
import { slugify } from "./utils/format";
import Header from "./components/layout/Header";
import {
  emptyJournal,
  loadJournal,
  saveJournal,
  type JournalData,
} from "./lib/appData";
import { createSaveQueue, type SaveState } from "./lib/saveQueue";

type TabId = "review" | "hottest" | "collection" | "listen" | "history";
type Which = "all" | "year";
type SlotValue = Album | number | string | string[] | null;

export default function App() {
  const [tab, setTab] = useState<TabId>("hottest");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [listenLater, setListenLater] = useState<ListenLaterItem[]>([]);
  const [top4All, setTop4All] = useState<Top4>([null, null, null, null]);
  const [top4Year, setTop4Year] = useState<Top4>([null, null, null, null]);
  const [slots, setSlots] = useState<Slot[]>(EMPTY);
  const [weekKey, setWeekKey] = useState(getWeekKey);
  const [editTop4, setEditTop4] = useState<Which | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notifFeed, setNotifFeed] = useState<AppNotification[]>([]); // full panel feed — survives mark-as-read
  const [panelOpen, setPanelOpen] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [journalStatus, setJournalStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [saveStatus, setSaveStatus] = useState<SaveState>("idle");
  const [notificationError, setNotificationError] = useState<string | null>(
    null,
  );
  const journalRef = useRef<JournalData>(emptyJournal());
  const saveQueueRef = useRef<ReturnType<
    typeof createSaveQueue<JournalData>
  > | null>(null);
  const displayNameRef = useRef<{ userId: string | null; name: string | null }>(
    { userId: null, name: null },
  );
  displayNameRef.current = {
    userId: user?.id ?? null,
    name: user?.user_metadata?.display_name || null,
  };

  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const sp = useSpotify(clientId, user);

  // Effect A: Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser((prev) => {
        const next = data.session?.user ?? null;
        if (prev?.id === next?.id) return prev;
        return next;
      });
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser((prev) => {
          const next = session?.user ?? null;
          if (prev?.id === next?.id) return prev;
          return next;
        });
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // Effect: Sync display_name into app_data on every login
  useEffect(() => {
    if (!user?.id) return;
    const dn = user.user_metadata?.display_name;
    if (!dn) return;
    supabase
      .from("app_data")
      .update({ display_name: dn })
      .eq("id", user.id)
      .then(({ error }) => {
        if (error) console.error("[name sync]", error);
      });
  }, [user?.id, user?.user_metadata?.display_name]);

  useEffect(() => {
    let cancelled = false;
    const userId = user?.id;
    const initialDisplayName = displayNameRef.current.name;
    const initial = emptyJournal();
    journalRef.current = initial;
    saveQueueRef.current = null;
    setReviews(initial.reviews);
    setListenLater(initial.listenLater);
    setTop4All(initial.top4All);
    setTop4Year(initial.top4Year);
    setAvatar(null);
    setSlots(EMPTY());
    setSaveStatus("idle");
    setLoadedUserId(null);
    setJournalStatus("loading");
    if (userId) {
      loadJournal(userId)
        .then((journal) => {
          if (cancelled) return;
          journalRef.current = journal;
          setReviews(journal.reviews);
          setListenLater(journal.listenLater);
          setTop4All(journal.top4All);
          setTop4Year(journal.top4Year);
          setAvatar(journal.avatar);
          setSlots(buildSlotsFromReviews(journal.reviews, getWeekKey()));
          saveQueueRef.current = createSaveQueue(
            (data: JournalData) =>
              saveJournal(
                userId,
                displayNameRef.current.userId === userId
                  ? displayNameRef.current.name
                  : initialDisplayName,
                data,
              ),
            (status, error) => {
              if (cancelled) return;
              if (error) console.error("[journal save failed]", error);
              setSaveStatus(status);
            },
          );
          setJournalStatus("ready");
          setLoadedUserId(userId);
        })
        .catch((error: unknown) => {
          if (cancelled) return;
          console.error("[journal load failed]", error);
          setJournalStatus("error");
        });
    }
    return () => {
      cancelled = true;
    };
  }, [user?.id, loadAttempt]);

  // Effect: Load notifications
  useEffect(() => {
    setNotifications([]);
    setNotifFeed([]);
    setNotificationError(null);
    setPanelOpen(false);
    setAvatarPickerOpen(false);
    if (!user) return;
    let cancelled = false;
    // Load all notifications for the feed, derive unread count for badge
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("[notifications load failed]", error);
          setNotificationError("Could not load notifications.");
          return;
        }
        const all: AppNotification[] = data || [];
        setNotifFeed(all);
        setNotifications(all.filter((n) => !n.read));
      });

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const n = payload.new as AppNotification;
          setNotifications((prev) => [n, ...prev]);
          setNotifFeed((prev) => [n, ...prev].slice(0, 50));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markNotificationsRead = async () => {
    if (!user || notifications.length === 0) return;
    const userId = user.id;
    const ids = new Set(notifications.map((notification) => notification.id));
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", userId)
        .in("id", [...ids]);
      if (error) throw error;
    } catch (error) {
      console.error("[notifications update failed]", error);
      if (displayNameRef.current.userId === userId)
        setNotificationError("Could not mark notifications as read.");
      return;
    }
    if (displayNameRef.current.userId !== userId) return;
    setNotifications((prev) =>
      prev.filter((notification) => !ids.has(notification.id)),
    );
    // Mark items as read in the feed so the red borders clear — but keep them visible
    setNotifFeed((prev) =>
      prev.map((n) => (ids.has(n.id) ? { ...n, read: true } : n)),
    );
  };

  const persist = (patch: Partial<JournalData>) => {
    if (!saveQueueRef.current) {
      console.error("[journal save failed] Journal is not loaded");
      setSaveStatus("error");
      return;
    }
    journalRef.current = { ...journalRef.current, ...patch };
    saveQueueRef.current.enqueue(journalRef.current);
  };

  const updateAvatar = (val: string | null) => {
    setAvatar(val);
    persist({ avatar: val });
    setAvatarPickerOpen(false);
  };

  const shiftWeek = (days: number) => {
    const newKey = shiftWeekKey(weekKey, days);
    setWeekKey(newKey);
    setSlots(buildSlotsFromReviews(reviews, newKey));
  };

  const resetWeek = () => {
    const newKey = getWeekKey();
    setWeekKey(newKey);
    setSlots(buildSlotsFromReviews(reviews, newKey));
  };

  const updateSlot = (id: string, field: SlotField, val: SlotValue) =>
    setSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: val } : s)),
    );

  const rollRS = async () => {
    const done = reviews.filter((r) => r.type === "rs500").map((r) => r.album);
    const pool = RS500.filter((r) => !done.includes(r.album));
    const pick = (pool.length > 0 ? pool : RS500)[
      Math.floor(Math.random() * (pool.length || RS500.length))
    ];

    const base = {
      artist: pick.artist,
      album: pick.album,
      year: pick.year,
      rs500Rank: pick.rank,
    };
    updateSlot("rs", "album", base);
    updateSlot("rs", "rating", 0);
    updateSlot("rs", "topTracks", []);
    updateSlot("rs", "notes", "");

    if (sp.token) {
      const results = await sp.searchAlbums(`${pick.artist} ${pick.album}`);
      if (results?.length > 0) {
        updateSlot("rs", "album", {
          ...results[0],
          year: pick.year,
          rs500Rank: pick.rank,
        });
      }
    }
  };

  const submit = () => {
    const done = slots.filter((s) => s.album && s.rating > 0);
    if (!done.length) return;
    const entries: Review[] = done.flatMap((s) =>
      s.album
        ? [
            {
              id: `${weekKey}-${s.id}-${Date.now() + Math.random()}`,
              weekKey,
              type: s.type,
              artist: s.album.artist,
              album: s.album.album,
              year: s.album.year,
              image: s.album.image || null,
              spotifyId: s.album.spotifyId || null,
              rating: s.rating,
              topTracks: s.topTracks || [],
              notes: s.notes,
              reviewedAt: new Date().toISOString(),
              rs500Rank:
                s.type === "rs500"
                  ? s.album.rs500Rank ||
                    RS500.find((r) => r.album === s.album?.album)?.rank ||
                    null
                  : null,
            },
          ]
        : [],
    );
    const filtered = reviews.filter(
      (r) => !(r.weekKey === weekKey && entries.some((e) => e.type === r.type)),
    );
    const updated = [...filtered, ...entries];
    setReviews(updated);
    persist({ reviews: updated });
    setTab("collection");
  };

  const del = (id: string) => {
    const updated = reviews.filter((r) => r.id !== id);
    setReviews(updated);
    persist({ reviews: updated });
  };

  const addLL = (album: Album) => {
    if (
      listenLater.find(
        (a) => a.album === album.album && a.artist === album.artist,
      )
    )
      return;
    const updated = [
      ...listenLater,
      { ...album, addedAt: new Date().toISOString() },
    ];
    setListenLater(updated);
    persist({ listenLater: updated });
  };

  const removeLL = (idx: number) => {
    const updated = listenLater.filter((_, i) => i !== idx);
    setListenLater(updated);
    persist({ listenLater: updated });
  };

  const addPastReview = (
    album: Album,
    rating: number,
    topTracks: string[],
    notes: string,
  ) => {
    const entry: Review = {
      id: `past-${Date.now()}-${Math.random()}`,
      weekKey,
      type: "past",
      artist: album.artist,
      album: album.album,
      year: album.year || null,
      image: album.image || null,
      spotifyId: album.spotifyId || null,
      rating,
      topTracks: topTracks || [],
      notes: notes || "",
      reviewedAt: new Date().toISOString(),
      rs500Rank: null,
    };
    const updated = [...reviews, entry];
    setReviews(updated);
    persist({ reviews: updated });
  };

  const pushToReview = (album: Album, llIdx: number) => {
    const emptySlot = slots.find((s) => !s.album);
    if (emptySlot) updateSlot(emptySlot.id, "album", album);
    removeLL(llIdx);
    setTab("review");
  };

  const swapTop = (which: Which, fromIdx: number, toIdx: number) => {
    if (which === "all") {
      const updated = [...top4All];
      [updated[fromIdx], updated[toIdx]] = [updated[toIdx], updated[fromIdx]];
      setTop4All(updated);
      persist({ top4All: updated });
    } else {
      const updated = [...top4Year];
      [updated[fromIdx], updated[toIdx]] = [updated[toIdx], updated[fromIdx]];
      setTop4Year(updated);
      persist({ top4Year: updated });
    }
  };

  const updateTop = (which: Which, idx: number, albumObj: Album | null) => {
    if (which === "all") {
      const updated = [...top4All];
      updated[idx] = albumObj; // album object { artist, album, image, spotifyId } or null to clear
      setTop4All(updated);
      persist({ top4All: updated });
    } else {
      const updated = [...top4Year];
      updated[idx] = albumObj;
      setTop4Year(updated);
      persist({ top4Year: updated });
    }
  };

  if (!user) return <AuthScreen />;
  if (journalStatus !== "ready" || loadedUserId !== user.id) {
    return (
      <div className="mx-auto max-w-xl p-8 text-center" role="status">
        {journalStatus === "loading" ? (
          "Loading your journal…"
        ) : (
          <>
            <p>Could not load your journal. Please try again.</p>
            <button type="button" onClick={() => setLoadAttempt((n) => n + 1)}>
              Retry
            </button>
          </>
        )}
      </div>
    );
  }

  const displayName = user.user_metadata?.display_name;
  const journalLabel = displayName
    ? `${displayName}${displayName.endsWith("s") ? "'" : "'s"} album journal`
    : "your album journal";

  const profileUrl = displayName
    ? `${window.location.origin}/u/${slugify(displayName)}`
    : null;

  const saveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    await supabase.auth.updateUser({ data: { display_name: trimmed } });
    supabase
      .from("app_data")
      .update({ display_name: trimmed })
      .eq("id", user.id)
      .then((res) => {
        if (res.error) console.error("[display_name sync error]", res.error);
      }, console.error);
    setUser(
      (prev) =>
        prev && {
          ...prev,
          user_metadata: { ...prev.user_metadata, display_name: trimmed },
        },
    );
    setEditingName(false);
  };

  const handleNameKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") saveName();
    if (event.key === "Escape") setEditingName(false);
  };

  const editName = () => {
    setNameInput(user.user_metadata?.display_name ?? "");
    setEditingName(true);
  };

  const completed = slots.filter((s) => s.album && s.rating > 0).length;

  return (
    <div className="mx-auto min-h-screen max-w-[720px] bg-background px-3.5 pb-[90px] font-serif text-foreground">
      {notificationError && (
        <div role="alert" className="p-2 text-center text-sm text-destructive">
          {notificationError}{" "}
          <button type="button" onClick={() => setNotificationError(null)}>
            Dismiss
          </button>
        </div>
      )}
      {saveStatus !== "idle" && (
        <div
          role={saveStatus === "error" ? "alert" : "status"}
          className="p-2 text-center text-sm"
        >
          {saveStatus === "saving" ? (
            "Saving changes…"
          ) : (
            <>
              Could not save your changes.{" "}
              <button
                type="button"
                onClick={() => saveQueueRef.current?.retry()}
              >
                Retry
              </button>
            </>
          )}
        </div>
      )}
      <Header
        displayName={displayName}
        journalLabel={journalLabel}
        editingName={editingName}
        nameInput={nameInput}
        onNameInputChange={setNameInput}
        onNameKeyDown={handleNameKeyDown}
        onSaveName={saveName}
        onCancelNameEdit={() => setEditingName(false)}
        onEditName={editName}
        avatar={avatar}
        onAvatarClick={() => setAvatarPickerOpen(true)}
        notificationCount={notifications.length}
        onOpenFriends={() => setPanelOpen(true)}
        profileUrl={profileUrl}
        onShareProfile={() => {
          if (profileUrl) navigator.clipboard.writeText(profileUrl);
        }}
        onSignOut={() => supabase.auth.signOut()}
        spotifyConnected={!!sp.token && !sp.expired}
        spotifyExpired={sp.expired}
        onSpotifyReconnect={() => {
          sp.disconnect();
          sp.login();
        }}
        onSpotifyLogin={sp.login}
        selectedTab={tab === "history" ? null : tab}
        onTabChange={setTab}
      />

      {tab === "review" && (
        <ReviewTab
          slots={slots}
          weekKey={weekKey}
          shiftWeek={shiftWeek}
          resetWeek={resetWeek}
          updateSlot={updateSlot}
          rollRS={rollRS}
          sp={sp}
          completed={completed}
          submit={submit}
          onSavePast={addPastReview}
        />
      )}
      {tab === "hottest" && (
        <HottestWaxTab
          user={user}
          reviews={reviews}
          addLL={addLL}
          userAvatar={avatar}
        />
      )}
      {tab === "collection" && (
        <CollectionTab
          reviews={reviews}
          top4All={top4All}
          top4Year={top4Year}
          editTop4={editTop4}
          setEditTop4={setEditTop4}
          updateTop={updateTop}
          swapTop={swapTop}
          del={del}
          sp={sp}
        />
      )}
      {tab === "history" && <HistoryTab reviews={reviews} del={del} />}
      {tab === "listen" && (
        <ListenLaterTab
          listenLater={listenLater}
          addLL={addLL}
          removeLL={removeLL}
          sp={sp}
          onMoveToReview={pushToReview}
        />
      )}

      {avatarPickerOpen && (
        <AvatarPicker
          currentAvatar={avatar}
          displayName={displayName}
          sp={sp}
          onSave={updateAvatar}
          onClose={() => setAvatarPickerOpen(false)}
        />
      )}

      {panelOpen && (
        <FriendsPanel
          user={user}
          notifications={notifications}
          notifFeed={notifFeed}
          onClose={() => setPanelOpen(false)}
          onNotificationsRead={() => {
            markNotificationsRead();
          }}
          addLL={addLL}
          addToThisWeek={(album) => {
            const emptySlot = slots.find((s) => !s.album);
            if (emptySlot) updateSlot(emptySlot.id, "album", album);
            setPanelOpen(false);
            setTab("review");
          }}
        />
      )}
    </div>
  );
}
