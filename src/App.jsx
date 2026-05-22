import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import useSpotify from "./hooks/useSpotify";
import { EMPTY, buildSlotsFromReviews } from "./utils/slots";
import { RS500 } from "./utils/data";
import { NOW_YEAR, getWeekKey } from "./utils/time";
import AuthScreen from "./components/AuthScreen";
import FriendsPanel from "./components/FriendsPanel";
import { Btn } from "./components/ui";
import ReviewTab from "./tabs/ReviewTab";
import HistoryTab from "./tabs/HistoryTab";
import CollectionTab from "./tabs/CollectionTab";
import HottestWaxTab from "./tabs/HottestWaxTab";
import ListenLaterTab from "./tabs/ListenLaterTab";

function slugify(name) {
  return name?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "";
}

function RecordIcon({ count, onClick }) {
  return (
    <button onClick={onClick} style={{ position: "relative", background: "none", border: "none",
      cursor: "pointer", padding: 0, lineHeight: 1 }} title="Friends & Notifications">
      <span style={{ fontSize: 20 }}>💿</span>
      {count > 0 && (
        <span style={{ position: "absolute", top: -4, right: -6, background: "#F4C542",
          color: "#0d0d1a", borderRadius: "50%", width: 16, height: 16, fontSize: 10,
          fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}

export default function App() {
  const [tab, setTab] = useState("hottest");
  const [reviews, setReviews] = useState([]);
  const [listenLater, setListenLater] = useState([]);
  const [top4All, setTop4All] = useState([null, null, null, null]);
  const [top4Year, setTop4Year] = useState([null, null, null, null]);
  const [slots, setSlots] = useState(EMPTY);
  const [weekKey, setWeekKey] = useState(getWeekKey);
  const [wrapYear, setWrapYear] = useState(NOW_YEAR);
  const [editTop4, setEditTop4] = useState(null);
  const [user, setUser] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);

  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const sp = useSpotify(clientId, user);

  // Effect A: Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(prev => {
        const next = data.session?.user ?? null;
        if (prev?.id === next?.id) return prev;
        return next;
      });
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(prev => {
        const next = session?.user ?? null;
        if (prev?.id === next?.id) return prev;
        return next;
      });
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Effect: Sync display_name into app_data on every login
  useEffect(() => {
    if (!user?.id) return;
    const dn = user.user_metadata?.display_name;
    if (!dn) return;
    supabase.from("app_data")
      .update({ display_name: dn })
      .eq("id", user.id)
      .then(({ error }) => { if (error) console.error("[name sync]", error); });
  }, [user?.id]);

  // Effect B: Hydration
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    supabase.from("app_data")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) { console.error("[hydration error]", error); return; }
        // Sync display_name into app_data if it's missing or stale
        const dn = user.user_metadata?.display_name || null;
        if (dn && data?.display_name !== dn) {
          supabase.from("app_data")
            .upsert({ id: user.id, display_name: dn, data: data?.data || {} })
            .then(() => {});
        }
        if (!data?.data?.reviews?.length) return;
        const d = data.data;
        setReviews(d.reviews);
        if (d.listenLater?.length) setListenLater(d.listenLater);
        // Migrate top4: old format stores review ID strings, new format stores album objects
        const migrateTop4 = (arr) => (arr || [null,null,null,null]).map(item => {
          if (!item || typeof item === "object") return item;
          const r = d.reviews.find(x => x.id === item);
          return r ? { artist: r.artist, album: r.album, image: r.image || null, spotifyId: r.spotifyId || null } : null;
        });
        if (d.top4All) setTop4All(migrateTop4(d.top4All));
        if (d.top4Year) setTop4Year(migrateTop4(d.top4Year));
        setSlots(buildSlotsFromReviews(d.reviews, getWeekKey()));
      })
      .catch(err => { if (!cancelled) console.error("[hydration failed]", err); });

    return () => { cancelled = true; };
  }, [user]);

  // Effect: Load notifications
  useEffect(() => {
    if (!user) return;
    supabase.from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .eq("read", false)
      .order("created_at", { ascending: false })
      .then(({ data }) => setNotifications(data || []));

    const channel = supabase.channel("notifications")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "notifications",
        filter: `user_id=eq.${user.id}`,
      }, payload => {
        setNotifications(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  const markNotificationsRead = async () => {
    if (notifications.length === 0) return;
    await supabase.from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
    setNotifications([]);
  };

  const persist = (r = reviews, ll = listenLater, t4a = top4All, t4y = top4Year) => {
    if (!user) return;
    const dn = user.user_metadata?.display_name || null;
    supabase.from("app_data")
      .upsert({ id: user.id, display_name: dn, data: { reviews: r, listenLater: ll, top4All: t4a, top4Year: t4y } })
      .then(res => { if (res.error) console.error("[persist error]", res.error); })
      .catch(console.error);
  };

  const shiftWeek = (days) => {
    const d = new Date(weekKey);
    d.setDate(d.getDate() + days);
    const newKey = d.toISOString().split("T")[0];
    setWeekKey(newKey);
    setSlots(buildSlotsFromReviews(reviews, newKey));
  };

  const resetWeek = () => {
    const newKey = getWeekKey();
    setWeekKey(newKey);
    setSlots(buildSlotsFromReviews(reviews, newKey));
  };

  const updateSlot = (id, field, val) =>
    setSlots(prev => prev.map(s => s.id === id ? { ...s, [field]: val } : s));

  const rollRS = async () => {
    const done = reviews.filter(r => r.type === "rs500").map(r => r.album);
    const pool = RS500.filter(r => !done.includes(r.album));
    const pick = (pool.length > 0 ? pool : RS500)[Math.floor(Math.random() * (pool.length || RS500.length))];

    const base = { artist: pick.artist, album: pick.album, year: pick.year, rs500Rank: pick.rank };
    updateSlot("rs", "album", base);
    updateSlot("rs", "rating", 0);
    updateSlot("rs", "topTracks", []);
    updateSlot("rs", "notes", "");

    if (sp.token) {
      const results = await sp.searchAlbums(`${pick.artist} ${pick.album}`);
      if (results?.length > 0) {
        updateSlot("rs", "album", { ...results[0], year: pick.year, rs500Rank: pick.rank });
      }
    }
  };

  const submit = () => {
    const done = slots.filter(s => s.album && s.rating > 0);
    if (!done.length) return;
    const entries = done.map(s => ({
      id: `${weekKey}-${s.id}-${Date.now() + Math.random()}`,
      weekKey, type: s.type,
      artist: s.album.artist, album: s.album.album, year: s.album.year,
      image: s.album.image || null, spotifyId: s.album.spotifyId || null,
      rating: s.rating, topTracks: s.topTracks || [], notes: s.notes,
      reviewedAt: new Date().toISOString(),
      rs500Rank: s.type === "rs500"
        ? (s.album.rs500Rank || RS500.find(r => r.album === s.album.album)?.rank || null)
        : null,
    }));
    const filtered = reviews.filter(
      r => !(r.weekKey === weekKey && entries.some(e => e.type === r.type))
    );
    const updated = [...filtered, ...entries];
    setReviews(updated);
    persist(updated);
    setTab("collection");
  };

  const del = (id) => {
    const updated = reviews.filter(r => r.id !== id);
    setReviews(updated);
    persist(updated);
  };

  const addLL = (album) => {
    if (listenLater.find(a => a.album === album.album && a.artist === album.artist)) return;
    const updated = [...listenLater, { ...album, addedAt: new Date().toISOString() }];
    setListenLater(updated);
    persist(reviews, updated);
  };

  const removeLL = (idx) => {
    const updated = listenLater.filter((_, i) => i !== idx);
    setListenLater(updated);
    persist(reviews, updated);
  };

  const addPastReview = (album, rating, topTracks, notes) => {
    const entry = {
      id: `past-${Date.now()}-${Math.random()}`,
      weekKey, type: "past",
      artist: album.artist, album: album.album, year: album.year || null,
      image: album.image || null, spotifyId: album.spotifyId || null,
      rating, topTracks: topTracks || [], notes: notes || "",
      reviewedAt: new Date().toISOString(),
      rs500Rank: null,
    };
    const updated = [...reviews, entry];
    setReviews(updated);
    persist(updated);
  };

  const pushToReview = (album, llIdx) => {
    const emptySlot = slots.find(s => !s.album);
    if (emptySlot) updateSlot(emptySlot.id, "album", album);
    removeLL(llIdx);
    setTab("review");
  };

  const updateTop = (which, idx, albumObj) => {
    if (which === "all") {
      const updated = [...top4All];
      updated[idx] = albumObj; // album object { artist, album, image, spotifyId } or null to clear
      setTop4All(updated);
      persist(reviews, listenLater, updated, top4Year);
    } else {
      const updated = [...top4Year];
      updated[idx] = albumObj;
      setTop4Year(updated);
      persist(reviews, listenLater, top4All, updated);
    }
  };

  if (!user) return <AuthScreen />;

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
    supabase.from("app_data")
      .update({ display_name: trimmed })
      .eq("id", user.id)
      .then(res => { if (res.error) console.error("[display_name sync error]", res.error); })
      .catch(console.error);
    setUser(prev => ({ ...prev, user_metadata: { ...prev.user_metadata, display_name: trimmed } }));
    setEditingName(false);
  };

  const S = {
    app:    { background: "#0d0d1a", minHeight: "100vh", color: "#e0e0f0", fontFamily: "Georgia,serif",
              maxWidth: 720, margin: "0 auto", padding: "0 14px 90px" },
    tabBar: { display: "flex", gap: 3, marginTop: 20, background: "#0a0a18", borderRadius: 12, padding: 3 },
    tab:    a => ({ flex: 1, padding: "8px 0", background: a ? "#1a1a30" : "transparent",
      border: a ? "1px solid #2a2a4a" : "1px solid transparent",
      borderRadius: 8, color: a ? "#e0e0f0" : "#555", fontSize: 12, cursor: "pointer" }),
  };

  const completed = slots.filter(s => s.album && s.rating > 0).length;

  const tabs = [
    ["review",      "This Week"],
    ["hottest",     "Hottest Wax"],
    ["collection",  "Collection"],
    ["listen",      "Listen Later"],
  ];

  return (
    <div style={S.app}>
      <div style={{ paddingTop: 28, textAlign: "center" }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>🔥 Hot Wax Weekly</h1>
        {editingName ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 6 }}>
            <input
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") saveName();
                if (e.key === "Escape") setEditingName(false);
              }}
              autoFocus
              placeholder="Your name"
              style={{ background: "#1a1a2e", border: "1px solid #2a2a4e", borderRadius: 6,
                padding: "4px 10px", color: "#e0e0f0", fontSize: 13, outline: "none", width: 160 }}
            />
            <button onClick={saveName}
              style={{ background: "#F4C542", border: "none", borderRadius: 6, padding: "4px 10px",
                color: "#0d0d1a", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Save</button>
            <button onClick={() => setEditingName(false)}
              style={{ background: "none", border: "none", color: "#555", fontSize: 18, cursor: "pointer" }}>×</button>
          </div>
        ) : (
          <p style={{ color: "#444", fontSize: 12, marginTop: 4, fontStyle: "italic" }}>
            {journalLabel}
            <button onClick={() => { setNameInput(user.user_metadata?.display_name ?? ""); setEditingName(true); }}
              style={{ background: "none", border: "none", color: "#333", fontSize: 11,
                cursor: "pointer", marginLeft: 6 }}>✎</button>
          </p>
        )}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 4 }}>
          <RecordIcon count={notifications.length} onClick={() => setPanelOpen(true)} />
          {profileUrl && (
            <button onClick={() => navigator.clipboard.writeText(profileUrl)} title={profileUrl}
              style={{ background: "none", border: "none", color: "#555", fontSize: 11,
                cursor: "pointer", textDecoration: "underline" }}>
              Share profile
            </button>
          )}
          <button onClick={() => supabase.auth.signOut()}
            style={{ background: "none", border: "none", color: "#333", fontSize: 11,
              cursor: "pointer", textDecoration: "underline" }}>
            Sign out
          </button>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 8 }}>
          {sp.token && !sp.expired
            ? <span style={{ fontSize: 11, color: "#1DB954" }}>● Spotify connected</span>
            : sp.expired
            ? <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: "#ff6b6b" }}>● Spotify disconnected</span>
                <Btn onClick={() => { sp.disconnect(); sp.login(); }} variant="spotify"
                  style={{ padding: "4px 12px", fontSize: 11 }}>Reconnect</Btn>
              </div>
            : <Btn onClick={sp.login} variant="spotify" style={{ padding: "5px 14px", fontSize: 11 }}>
                Connect Spotify
              </Btn>
          }
        </div>
        <div style={S.tabBar}>
          {tabs.map(([id, lbl]) => (
            <button key={id} style={S.tab(tab === id)} onClick={() => setTab(id)}>{lbl}</button>
          ))}
        </div>
      </div>

      {tab === "review"     && <ReviewTab slots={slots} weekKey={weekKey} shiftWeek={shiftWeek}
                                  resetWeek={resetWeek} updateSlot={updateSlot} rollRS={rollRS}
                                  sp={sp} completed={completed} submit={submit} onSavePast={addPastReview} />}
      {tab === "hottest"    && <HottestWaxTab user={user} reviews={reviews} />}
      {tab === "collection" && <CollectionTab reviews={reviews} top4All={top4All} top4Year={top4Year}
                                  editTop4={editTop4} setEditTop4={setEditTop4} updateTop={updateTop} del={del} sp={sp} />}
      {tab === "history"    && <HistoryTab reviews={reviews} del={del} />}
      {tab === "listen"     && <ListenLaterTab listenLater={listenLater} addLL={addLL}
                                  removeLL={removeLL} sp={sp} onMoveToReview={pushToReview} />}

      {panelOpen && (
        <FriendsPanel
          user={user}
          notifications={notifications}
          onClose={() => setPanelOpen(false)}
          onNotificationsRead={() => { markNotificationsRead(); }}
        />
      )}
    </div>
  );
}
