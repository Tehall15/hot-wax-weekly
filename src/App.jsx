import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import useSpotify from "./hooks/useSpotify";
import { EMPTY, buildSlotsFromReviews } from "./utils/slots";
import { RS500 } from "./utils/data";
import { NOW_YEAR, getWeekKey } from "./utils/time";
import AuthScreen from "./components/AuthScreen";
import { Btn } from "./components/ui";
import ReviewTab from "./tabs/ReviewTab";
import HistoryTab from "./tabs/HistoryTab";
import CoversTab from "./tabs/CoversTab";
import Top4Tab from "./tabs/Top4Tab";
import ListenLaterTab from "./tabs/ListenLaterTab";
import WrapTab from "./tabs/WrapTab";

export default function App() {
  const [tab, setTab] = useState("review");
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

  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const sp = useSpotify(clientId, user);

  // Effect A: Auth only — restore session, listen for changes
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

  // Effect B: Hydration only — runs when user is known, never blocks rendering
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
        if (!data?.data?.reviews?.length) return;
        const d = data.data;
        const hydratedReviews = d.reviews;
        setReviews(hydratedReviews);
        if (d.listenLater?.length) setListenLater(d.listenLater);
        if (d.top4All) setTop4All(d.top4All);
        if (d.top4Year) setTop4Year(d.top4Year);
        setSlots(buildSlotsFromReviews(hydratedReviews, getWeekKey()));
      })
      .catch(err => { if (!cancelled) console.error("[hydration failed]", err); });

    return () => { cancelled = true; };
  }, [user]);

  // Persistence: fire-and-forget background sync
  const persist = (r = reviews, ll = listenLater, t4a = top4All, t4y = top4Year) => {
    if (!user) return;
    supabase.from("app_data")
      .upsert({ id: user.id, data: { reviews: r, listenLater: ll, top4All: t4a, top4Year: t4y } })
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

    // Set immediately with RS500 data — no waiting
    const base = { artist: pick.artist, album: pick.album, year: pick.year, rs500Rank: pick.rank };
    updateSlot("rs", "album", base);
    updateSlot("rs", "rating", 0);
    updateSlot("rs", "topTracks", []);
    updateSlot("rs", "notes", "");

    // Silently enrich with Spotify cover + ID if connected
    if (sp.token) {
      const results = await sp.searchAlbums(`${pick.artist} ${pick.album}`);
      if (results?.length > 0) {
        updateSlot("rs", "album", {
          ...results[0],
          year: pick.year,       // keep original RS500 year, not reissue year
          rs500Rank: pick.rank,
        });
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
    setTab("history");
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

  const updateTop = (which, idx, reviewId) => {
    if (!reviews.find(r => r.id === reviewId)) return;
    if (which === "all") {
      const updated = [...top4All];
      updated[idx] = reviewId;
      setTop4All(updated);
      persist(reviews, listenLater, updated, top4Year);
    } else {
      const updated = [...top4Year];
      updated[idx] = reviewId;
      setTop4Year(updated);
      persist(reviews, listenLater, top4All, updated);
    }
    setEditTop4(null);
  };

  if (!user) return <AuthScreen />;

  const displayName = user.user_metadata?.display_name;
  const journalLabel = displayName
    ? `${displayName}${displayName.endsWith("s") ? "'" : "'s"} album journal`
    : "your album journal";

  const saveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    await supabase.auth.updateUser({ data: { display_name: trimmed } });
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
    ["review",  "This Week"],
    ["history", `Collection (${reviews.length})`],
    ["covers",  "Covers"],
    ["top4",    "Top 4"],
    ["listen",  "Listen Later"],
    ["wrap",    "Year Wrap"],
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

      {tab === "review"   && <ReviewTab slots={slots} weekKey={weekKey} shiftWeek={shiftWeek}
                                resetWeek={resetWeek} updateSlot={updateSlot} rollRS={rollRS}
                                sp={sp} completed={completed} submit={submit} />}
      {tab === "history"  && <HistoryTab reviews={reviews} del={del} />}
      {tab === "covers"   && <CoversTab reviews={reviews} />}
      {tab === "top4"     && <Top4Tab reviews={reviews} top4All={top4All} top4Year={top4Year}
                                editTop4={editTop4} setEditTop4={setEditTop4} updateTop={updateTop} />}
      {tab === "listen"   && <ListenLaterTab listenLater={listenLater} addLL={addLL}
                                removeLL={removeLL} sp={sp} />}
      {tab === "wrap"     && <WrapTab reviews={reviews} wrapYear={wrapYear} setWrapYear={setWrapYear} />}
    </div>
  );
}
