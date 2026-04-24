import { useState, useEffect, useRef } from "react";

const RS500 = [
  { rank:1,artist:"The Beatles",album:"Sgt. Pepper's Lonely Hearts Club Band",year:1967 },
  { rank:2,artist:"The Beach Boys",album:"Pet Sounds",year:1966 },
  { rank:3,artist:"Joni Mitchell",album:"Blue",year:1971 },
  { rank:4,artist:"Stevie Wonder",album:"Songs in the Key of Life",year:1976 },
  { rank:5,artist:"The Beatles",album:"Abbey Road",year:1969 },
  { rank:6,artist:"Nirvana",album:"Nevermind",year:1991 },
  { rank:7,artist:"Fleetwood Mac",album:"Rumours",year:1977 },
  { rank:8,artist:"Prince",album:"Purple Rain",year:1984 },
  { rank:9,artist:"Bob Dylan",album:"Blood on the Tracks",year:1975 },
  { rank:10,artist:"Lauryn Hill",album:"The Miseducation of Lauryn Hill",year:1998 },
  { rank:11,artist:"The Beatles",album:"Revolver",year:1966 },
  { rank:12,artist:"Michael Jackson",album:"Thriller",year:1982 },
  { rank:13,artist:"Bob Dylan",album:"Blonde on Blonde",year:1966 },
  { rank:14,artist:"Elvis Presley",album:"The Sun Sessions",year:1976 },
  { rank:15,artist:"Miles Davis",album:"Kind of Blue",year:1959 },
  { rank:16,artist:"The Velvet Underground",album:"The Velvet Underground & Nico",year:1967 },
  { rank:17,artist:"The Rolling Stones",album:"Exile on Main St.",year:1972 },
  { rank:18,artist:"Led Zeppelin",album:"Led Zeppelin IV",year:1971 },
  { rank:19,artist:"Bruce Springsteen",album:"Born to Run",year:1975 },
  { rank:20,artist:"Marvin Gaye",album:"What's Going On",year:1971 },
  { rank:30,artist:"Radiohead",album:"OK Computer",year:1997 },
  { rank:31,artist:"The Clash",album:"London Calling",year:1979 },
  { rank:32,artist:"Kendrick Lamar",album:"To Pimp a Butterfly",year:2015 },
  { rank:33,artist:"Neil Young",album:"Harvest",year:1972 },
  { rank:40,artist:"Radiohead",album:"Kid A",year:2000 },
  { rank:41,artist:"Bob Marley",album:"Exodus",year:1977 },
  { rank:42,artist:"Kanye West",album:"My Beautiful Dark Twisted Fantasy",year:2010 },
  { rank:50,artist:"The Doors",album:"The Doors",year:1967 },
  { rank:51,artist:"Frank Ocean",album:"Blonde",year:2016 },
  { rank:60,artist:"Joy Division",album:"Unknown Pleasures",year:1979 },
  { rank:61,artist:"The Smiths",album:"The Queen Is Dead",year:1986 },
  { rank:70,artist:"Daft Punk",album:"Discovery",year:2001 },
  { rank:71,artist:"Outkast",album:"Aquemini",year:1998 },
  { rank:75,artist:"Sufjan Stevens",album:"Illinois",year:2005 },
  { rank:76,artist:"Wilco",album:"Yankee Hotel Foxtrot",year:2001 },
  { rank:77,artist:"The Strokes",album:"Is This It",year:2001 },
  { rank:78,artist:"Amy Winehouse",album:"Back to Black",year:2006 },
  { rank:79,artist:"LCD Soundsystem",album:"Sound of Silver",year:2007 },
  { rank:80,artist:"Arcade Fire",album:"Funeral",year:2004 },
  { rank:81,artist:"Kendrick Lamar",album:"good kid, m.A.A.d city",year:2012 },
  { rank:82,artist:"Beyonce",album:"Lemonade",year:2016 },
  { rank:83,artist:"Tyler, the Creator",album:"Igor",year:2019 },
  { rank:90,artist:"Fleet Foxes",album:"Fleet Foxes",year:2008 },
  { rank:91,artist:"Bon Iver",album:"For Emma, Forever Ago",year:2008 },
  { rank:92,artist:"Phoebe Bridgers",album:"Punisher",year:2020 },
  { rank:93,artist:"Mitski",album:"Be the Cowboy",year:2018 },
  { rank:94,artist:"Arctic Monkeys",album:"AM",year:2013 },
  { rank:95,artist:"Billie Eilish",album:"When We All Fall Asleep, Where Do We Go?",year:2019 },
];

const LOCAL_DB = [
  {artist:"The Beatles",album:"Abbey Road",year:1969},{artist:"The Rolling Stones",album:"Exile on Main St.",year:1972},
  {artist:"Led Zeppelin",album:"Led Zeppelin IV",year:1971},{artist:"Pink Floyd",album:"The Dark Side of the Moon",year:1973},
  {artist:"Radiohead",album:"OK Computer",year:1997},{artist:"David Bowie",album:"Ziggy Stardust",year:1972},
  {artist:"Nirvana",album:"Nevermind",year:1991},{artist:"Fleetwood Mac",album:"Rumours",year:1977},
  {artist:"Bob Dylan",album:"Blood on the Tracks",year:1975},{artist:"The Smiths",album:"The Queen Is Dead",year:1986},
  {artist:"Joy Division",album:"Unknown Pleasures",year:1979},{artist:"Arctic Monkeys",album:"AM",year:2013},
  {artist:"Kendrick Lamar",album:"To Pimp a Butterfly",year:2015},{artist:"Taylor Swift",album:"Folklore",year:2020},
  {artist:"Beyonce",album:"Lemonade",year:2016},{artist:"Kanye West",album:"My Beautiful Dark Twisted Fantasy",year:2010},
  {artist:"Frank Ocean",album:"Blonde",year:2016},{artist:"Amy Winehouse",album:"Back to Black",year:2006},
  {artist:"The Strokes",album:"Is This It",year:2001},{artist:"LCD Soundsystem",album:"Sound of Silver",year:2007},
  {artist:"Arcade Fire",album:"Funeral",year:2004},{artist:"Phoebe Bridgers",album:"Punisher",year:2020},
  {artist:"Tyler, the Creator",album:"Igor",year:2019},{artist:"Portishead",album:"Dummy",year:1994},
  {artist:"Daft Punk",album:"Discovery",year:2001},{artist:"Charli XCX",album:"Brat",year:2024},
  {artist:"SZA",album:"SOS",year:2022},{artist:"Fontaines D.C.",album:"Romance",year:2024},
];

const NOW_YEAR = new Date().getFullYear();
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const getWeekKey = () => { const d=new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()-d.getDay()+1); return d.toISOString().split("T")[0]; };

// PKCE helper functions
function generateRandomString(length) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
}

function base64encode(input) {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function useSpotify(clientId) {
  const [token, setToken] = useState(null);
  const REDIRECT = "https://hot-wax-weekly-8e4u-nu.vercel.app";

  useEffect(() => {
    // Check for code in URL (PKCE callback)
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    
    if (code) {
      const codeVerifier = localStorage.getItem('code_verifier');
      if (codeVerifier) {
        exchangeCodeForToken(code, codeVerifier, clientId);
      }
    }

    // Check for existing token
    const saved = sessionStorage.getItem("sp_token");
    if (saved) setToken(saved);
  }, [clientId]);

  const exchangeCodeForToken = async (code, codeVerifier, clientId) => {
    const payload = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT,
        code_verifier: codeVerifier,
      }),
    };

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', payload);
      const data = await response.json();
      
      if (data.access_token) {
        setToken(data.access_token);
        sessionStorage.setItem("sp_token", data.access_token);
        localStorage.removeItem('code_verifier');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (error) {
      console.error('Token exchange failed:', error);
    }
  };

  const login = async () => {
    if (!clientId) return;

    const codeVerifier = generateRandomString(64);
    const hashed = await sha256(codeVerifier);
    const codeChallenge = base64encode(hashed);

    localStorage.setItem('code_verifier', codeVerifier);

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: REDIRECT,
      scope: 'user-read-private',
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
    });

    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
  };

  const api = async (path) => {
    if (!token) return null;
    try {
      const r = await fetch(`https://api.spotify.com/v1/${path}`, { headers:{ Authorization:`Bearer ${token}` }});
      if (r.status === 401) { setToken(null); sessionStorage.removeItem("sp_token"); return null; }
      return await r.json();
    } catch { return null; }
  };

  const searchAlbums = async (q) => {
    if (!token || !q) return [];
    const data = await api(`search?q=${encodeURIComponent(q)}&type=album&limit=8`);
    if (!data?.albums?.items) return [];
    return data.albums.items.map(a => ({
      spotifyId: a.id, 
      artist: a.artists[0]?.name || "", 
      album: a.name,
      year: parseInt(a.release_date?.split("-")[0]) || 0,
      image: a.images?.[1]?.url || a.images?.[0]?.url || null,
    }));
  };

  const getTracklist = async (spotifyId) => {
    if (!token || !spotifyId) return [];
    const data = await api(`albums/${spotifyId}/tracks?limit=50`);
    return data?.items?.map((t,i) => ({ num: i+1, name: t.name })) || [];
  };

  const getNewReleases = async () => {
    if (!token) return [];
    const data = await api("browse/new-releases?limit=20&country=GB");
    if (!data?.albums?.items) return [];
    return data.albums.items.map(a => ({
      spotifyId: a.id, 
      artist: a.artists[0]?.name || "", 
      album: a.name,
      year: parseInt(a.release_date?.split("-")[0]) || 0,
      image: a.images?.[1]?.url || a.images?.[0]?.url || null,
    }));
  };

  return { token, login, searchAlbums, getTracklist, getNewReleases };
}

function StarRating({ value, onChange, readonly=false }) {
  const [hover, setHover] = useState(null);
  return (
    <div style={{display:"flex",gap:1,alignItems:"center"}}>
      {[...Array(10)].map((_,i) => {
        const v=i+1, filled=(hover??value)>=v;
        return (
          <button key={v} onClick={()=>!readonly&&onChange(v)}
            onMouseEnter={()=>!readonly&&setHover(v)} onMouseLeave={()=>!readonly&&setHover(null)}
            style={{background:"none",border:"none",cursor:readonly?"default":"pointer",
              padding:0,fontSize:20,color:filled?"#F4C542":"#2a2a3e",
              transition:"all .1s",transform:filled&&!readonly?"scale(1.15)":"scale(1)"}}>★</button>
        );
      })}
      {value>0 && <span style={{marginLeft:6,color:"#F4C542",fontWeight:700,fontSize:13}}>{value}/10</span>}
    </div>
  );
}

function AlbumArt({ src, size=56 }) {
  return src
    ? <img src={src} alt="" style={{width:size,height:size,borderRadius:6,objectFit:"cover",flexShrink:0}} />
    : <div style={{width:size,height:size,borderRadius:6,background:"#1a1a2e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.4,flexShrink:0}}>💿</div>;
}

function Pill({ children, color="#1e1e3a" }) {
  return <span style={{display:"inline-block",background:color,borderRadius:20,padding:"2px 9px",fontSize:11,color:"#888",border:"1px solid #2a2a4a"}}>{children}</span>;
}

function Btn({ children, onClick, variant="default", style={}, disabled=false }) {
  const variants = {
    primary:  {background:"#F4C542",color:"#0d0d1a"},
    ghost:    {background:"transparent",color:"#aaa",border:"1px solid #333"},
    spotify:  {background:"#1DB954",color:"#000"},
    default:  {background:"#1e1e3a",color:"#ccc"},
  };
  return <button onClick={onClick} disabled={disabled} style={{padding:"9px 18px",borderRadius:8,border:"none",cursor:disabled?"not-allowed":"pointer",
    fontSize:13,fontWeight:600,transition:"all .18s",opacity:disabled?0.5:1,...variants[variant],...style}}>{children}</button>;
}

function TrackPicker({ tracks, selectedTracks, onChange }) {
  const [input, setInput] = useState("");

  const toggle = (name) => {
    if (selectedTracks.includes(name)) onChange(selectedTracks.filter(t=>t!==name));
    else if (selectedTracks.length < 5) onChange([...selectedTracks, name]);
  };

  const add = () => {
    const t = input.trim();
    if (t && !selectedTracks.includes(t) && selectedTracks.length < 5) {
      onChange([...selectedTracks, t]);
      setInput("");
    }
  };

  return (
    <div>
      <div style={{fontSize:11,textTransform:"uppercase",letterSpacing:2,color:"#666",marginBottom:8}}>
        Top Tracks <span style={{color:"#444",fontStyle:"italic",textTransform:"none"}}>(up to 5)</span>
      </div>
      {tracks.length > 0 ? (
        <div style={{maxHeight:180,overflowY:"auto",display:"flex",flexWrap:"wrap",gap:6}}>
          {tracks.map(t => {
            const sel = selectedTracks.includes(t.name);
            return (
              <button key={t.num} onClick={()=>toggle(t.name)}
                style={{background:sel?"#2a2a1a":"#1a1a2e",border:`1px solid ${sel?"#F4C542":"#2a2a4e"}`,
                  borderRadius:6,padding:"5px 10px",color:sel?"#F4C542":"#888",fontSize:12,cursor:"pointer"}}>
                {t.num}. {t.name} {sel && "★"}
              </button>
            );
          })}
        </div>
      ) : (
        <div style={{display:"flex",gap:8}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()}
            placeholder="Type track name…"
            style={{flex:1,background:"#1a1a2e",border:"1px solid #333",borderRadius:8,
              padding:"8px 12px",color:"#e0e0f0",fontSize:13,outline:"none"}}/>
          <Btn onClick={add} variant="ghost" style={{padding:"8px 14px"}}>Add</Btn>
        </div>
      )}
      {selectedTracks.length > 0 && (
        <div style={{marginTop:8,display:"flex",flexWrap:"wrap",gap:6}}>
          {selectedTracks.map(t => (
            <span key={t} style={{background:"#1f1f0a",border:"1px solid #F4C542",borderRadius:20,
              padding:"3px 10px",fontSize:12,color:"#F4C542",display:"flex",alignItems:"center",gap:6}}>
              ★ {t}
              <button onClick={()=>onChange(selectedTracks.filter(x=>x!==t))}
                style={{background:"none",border:"none",color:"#888",cursor:"pointer",fontSize:13}}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function AlbumSearch({ onSelect, searchFn }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(()=>{
    const h=e=>{if(!ref.current?.contains(e.target))setOpen(false)};
    document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);
  },[]);

  const search = async (val) => {
    setQ(val);
    if (val.length < 2) { setResults([]); setOpen(false); return; }
    let found = [];
    if (searchFn) found = await searchFn(val);
    if (!found || found.length === 0) {
      const low = val.toLowerCase();
      found = LOCAL_DB.filter(a=>a.artist.toLowerCase().includes(low)||a.album.toLowerCase().includes(low)).slice(0,8);
    }
    setResults(found); setOpen(found.length>0);
  };

  return (
    <div ref={ref} style={{position:"relative",width:"100%"}}>
      <input value={q} onChange={e=>search(e.target.value)} onFocus={()=>q.length>=2&&setOpen(true)}
        placeholder="Search artist or album…"
        style={{width:"100%",background:"#1a1a2e",border:"1px solid #333",borderRadius:8,
          padding:"10px 14px",color:"#e0e0f0",fontSize:14,outline:"none",boxSizing:"border-box"}}/>
      {open && (
        <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:200,background:"#12122a",
          border:"1px solid #333",borderRadius:8,marginTop:4,maxHeight:280,overflowY:"auto",
          boxShadow:"0 12px 40px rgba(0,0,0,.6)"}}>
          {results.map((r,i)=>(
            <div key={i} onClick={()=>{onSelect(r);setQ("");setOpen(false);}}
              style={{padding:"10px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,
                borderBottom:"1px solid #1a1a2e"}}
              onMouseEnter={e=>e.currentTarget.style.background="#1e1e3a"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              {r.image && <img src={r.image} alt="" style={{width:36,height:36,borderRadius:4}}/>}
              <div>
                <div style={{color:"#e0e0f0",fontSize:14,fontWeight:600}}>{r.album}</div>
                <div style={{color:"#777",fontSize:12}}>{r.artist} · {r.year}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SlotCard({ slot, label, badge, color, updateSlot, rollRS, getTracklist, searchFn }) {
  const [tracks, setTracks] = useState([]);

  useEffect(()=>{
    if(slot.album?.spotifyId && getTracklist){
      getTracklist(slot.album.spotifyId).then(setTracks);
    }
  },[slot.album?.spotifyId, getTracklist]);

  return (
    <div style={{background:"#111122",border:"1px solid #1e1e3e",borderLeft:`3px solid ${color}`,borderRadius:12,padding:18,marginTop:14}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
        <span style={{fontSize:11,textTransform:"uppercase",letterSpacing:2,color:"#555"}}>{label}</span>
        <Pill color={color+"22"}>{badge}</Pill>
      </div>

      {slot.id==="rs" && !slot.album && (
        <Btn onClick={rollRS} variant="ghost" style={{width:"100%",marginBottom:12}}>🎲 Roll RS500</Btn>
      )}
      {slot.id==="rs" && slot.album && (
        <div style={{marginBottom:12,display:"flex",gap:10}}>
          <AlbumArt src={slot.album.image} size={44}/>
          <div style={{flex:1}}>
            <div style={{fontWeight:700}}>{slot.album.album}</div>
            <div style={{color:"#888",fontSize:12}}>{slot.album.artist}</div>
          </div>
          <Btn onClick={rollRS} variant="ghost" style={{padding:"5px 10px",fontSize:11}}>↺</Btn>
        </div>
      )}

      {slot.id!=="rs" && (
        <div style={{marginBottom:12}}>
          <AlbumSearch searchFn={searchFn} onSelect={a=>updateSlot("album",a)}/>
          {slot.album && (
            <div style={{marginTop:8,padding:8,background:"#1a1a2e",borderRadius:8,display:"flex",gap:10}}>
              <AlbumArt src={slot.album.image} size={40}/>
              <div style={{flex:1}}>
                <div style={{fontWeight:600}}>{slot.album.album}</div>
                <div style={{color:"#888",fontSize:12}}>{slot.album.artist}</div>
              </div>
              <button onClick={()=>updateSlot("album",null)} style={{background:"none",border:"none",color:"#555",cursor:"pointer",fontSize:18}}>×</button>
            </div>
          )}
        </div>
      )}

      {slot.album && (
        <>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,textTransform:"uppercase",letterSpacing:2,color:"#555",marginBottom:8}}>Rating</div>
            <StarRating value={slot.rating||0} onChange={v=>updateSlot("rating",v)}/>
          </div>
          <div style={{marginBottom:14}}>
            <TrackPicker tracks={tracks} selectedTracks={slot.topTracks||[]} onChange={v=>updateSlot("topTracks",v)}/>
          </div>
          <div>
            <div style={{fontSize:11,textTransform:"uppercase",letterSpacing:2,color:"#555",marginBottom:6}}>Notes</div>
            <textarea value={slot.notes||""} onChange={e=>updateSlot("notes",e.target.value)}
              placeholder="Thoughts…"
              style={{width:"100%",background:"#1a1a2e",border:"1px solid #2a2a4e",borderRadius:8,
                padding:"9px 12px",color:"#e0e0f0",fontSize:13,resize:"none",height:68,outline:"none",boxSizing:"border-box"}}/>
          </div>
        </>
      )}
    </div>
  );
}

const EMPTY = () => ([
  { id:"c1", type:"contemporary", album:null, rating:0, topTracks:[], notes:"" },
  { id:"c2", type:"contemporary", album:null, rating:0, topTracks:[], notes:"" },
  { id:"rs", type:"rs500", album:null, rating:0, topTracks:[], notes:"" },
]);

export default function App() {
  const [tab, setTab] = useState("review");
  const [reviews, setReviews] = useState([]);
  const [listenLater, setListenLater] = useState([]);
  const [top4All, setTop4All] = useState([null,null,null,null]);
  const [top4Year, setTop4Year] = useState([null,null,null,null]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [slots, setSlots] = useState(EMPTY());
  const [weekKey] = useState(getWeekKey());
  const [wrapYear, setWrapYear] = useState(NOW_YEAR);
  const [clientId, setClientId] = useState("");
  const [clientInput, setClientInput] = useState("");
  const [showSetup, setShowSetup] = useState(false);
  const [editTop4, setEditTop4] = useState(null);

  const sp = useSpotify(clientId);

  useEffect(()=>{
    (async()=>{
      try {
        const r = await window.storage.get("hotwax-v1");
        if (r) {
          const d=JSON.parse(r.value);
          setReviews(d.reviews||[]);
          setListenLater(d.listenLater||[]);
          setTop4All(d.top4All||[null,null,null,null]);
          setTop4Year(d.top4Year||[null,null,null,null]);
          setClientId(d.clientId||"");
          setClientInput(d.clientId||"");
        }
      } catch {}
      setLoaded(true);
    })();
  },[]);

  const persist = async (r=reviews, ll=listenLater, t4a=top4All, t4y=top4Year, cid=clientId) => {
    setSaving(true);
    try { await window.storage.set("hotwax-v1", JSON.stringify({reviews:r,listenLater:ll,top4All:t4a,top4Year:t4y,clientId:cid})); } catch {}
    setSaving(false);
  };

  const saveClient = async () => {
    setClientId(clientInput);
    await persist(reviews, listenLater, top4All, top4Year, clientInput);
    setShowSetup(false);
  };

  const updateSlot = (id, field, val) => setSlots(prev=>prev.map(s=>s.id===id?{...s,[field]:val}:s));

  const rollRS = () => {
    const done = reviews.filter(r=>r.type==="rs500").map(r=>r.album);
    const pool = RS500.filter(r=>!done.includes(r.album));
    const pick = (pool.length>0?pool:RS500)[Math.floor(Math.random()*(pool.length||RS500.length))];
    updateSlot("rs","album",{artist:pick.artist,album:pick.album,year:pick.year,rs500Rank:pick.rank});
    updateSlot("rs","rating",0); updateSlot("rs","topTracks",[]); updateSlot("rs","notes","");
  };

  const submit = async () => {
    const done = slots.filter(s=>s.album&&s.rating>0);
    if (!done.length) return;
    const entries = done.map(s=>({
      id:`${weekKey}-${s.id}-${Date.now()+Math.random()}`,
      weekKey, type:s.type,
      artist:s.album.artist, album:s.album.album, year:s.album.year,
      image:s.album.image||null, spotifyId:s.album.spotifyId||null,
      rating:s.rating, topTracks:s.topTracks||[], notes:s.notes,
      reviewedAt:new Date().toISOString(),
      rs500Rank:s.type==="rs500"?(s.album.rs500Rank||RS500.find(r=>r.album===s.album.album)?.rank||null):null,
    }));
    const updated = [...reviews,...entries];
    setReviews(updated);
    await persist(updated);
    setSlots(EMPTY());
    setTab("history");
  };

  const del = async (id) => {
    const updated = reviews.filter(r=>r.id!==id);
    setReviews(updated); await persist(updated);
  };

  const addLL = async (album) => {
    if (listenLater.find(a=>a.album===album.album&&a.artist===album.artist)) return;
    const updated = [...listenLater, {...album, addedAt:new Date().toISOString()}];
    setListenLater(updated); await persist(reviews, updated);
  };

  const removeLL = async (idx) => {
    const updated = listenLater.filter((_,i)=>i!==idx);
    setListenLater(updated); await persist(reviews, updated);
  };

  const updateTop = (which, idx, reviewId) => {
    const review = reviews.find(r=>r.id===reviewId);
    if (!review) return;
    if (which==="all") {
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

  const completed = slots.filter(s=>s.album&&s.rating>0).length;
  const years = [...new Set(reviews.map(r=>new Date(r.reviewedAt).getFullYear()))].sort((a,b)=>b-a);

  if (!loaded) return (
    <div style={{background:"#0d0d1a",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:"#555"}}>
      Loading…
    </div>
  );

  const S = {
    app:    {background:"#0d0d1a",minHeight:"100vh",color:"#e0e0f0",fontFamily:"Georgia,serif",maxWidth:720,margin:"0 auto",padding:"0 14px 90px"},
    card:   {background:"#111122",border:"1px solid #1e1e3e",borderRadius:12,padding:18,marginTop:14},
    tabBar: {display:"flex",gap:3,marginTop:20,background:"#0a0a18",borderRadius:12,padding:3},
    tab:    a=>({flex:1,padding:"8px 0",background:a?"#1a1a30":"transparent",border:a?"1px solid #2a2a4a":"1px solid transparent",
      borderRadius:8,color:a?"#e0e0f0":"#555",fontSize:12,cursor:"pointer"}),
  };

  const tabs = [
    ["review","This Week"],
    ["history",`Collection (${reviews.length})`],
    ["covers","Covers"],
    ["top4","Top 4"],
    ["listen","Listen Later"],
    ["wrap","Year Wrap"]
  ];

  return (
    <div style={S.app}>
      <div style={{paddingTop:28,textAlign:"center"}}>
        <h1 style={{fontSize:26,fontWeight:700,margin:0}}>🔥 Hot Wax Weekly</h1>
        <p style={{color:"#444",fontSize:12,marginTop:4,fontStyle:"italic"}}>your album journal</p>
        <div style={{display:"flex",justifyContent:"center",gap:10,marginTop:8}}>
          {sp.token
            ? <span style={{fontSize:11,color:"#1DB954"}}>● Spotify connected</span>
            : clientId
              ? <Btn onClick={sp.login} variant="spotify" style={{padding:"5px 14px",fontSize:11}}>Connect Spotify</Btn>
              : <Btn onClick={()=>setShowSetup(true)} variant="ghost" style={{padding:"5px 14px",fontSize:11}}>⚙ Setup</Btn>
          }
          {saving && <span style={{fontSize:10,color:"#444"}}>saving…</span>}
        </div>
      </div>

      {showSetup && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
          onClick={()=>setShowSetup(false)}>
          <div style={{background:"#12122a",border:"1px solid #2a2a4e",borderRadius:16,padding:24,maxWidth:400,width:"100%"}}
            onClick={e=>e.stopPropagation()}>
            <h3 style={{margin:"0 0 8px",fontSize:17}}>Connect Spotify</h3>
            <p style={{color:"#777",fontSize:13,margin:"0 0 16px"}}>
              Paste your <strong>Client ID</strong> from developer.spotify.com
            </p>
            <input value={clientInput} onChange={e=>setClientInput(e.target.value)}
              placeholder="Client ID…"
              style={{width:"100%",background:"#1a1a2e",border:"1px solid #333",borderRadius:8,
                padding:"10px 14px",color:"#e0e0f0",fontSize:13,outline:"none",boxSizing:"border-box",marginBottom:12}}/>
            <div style={{display:"flex",gap:8}}>
              <Btn onClick={saveClient} variant="primary" style={{flex:1}} disabled={!clientInput.trim()}>Save</Btn>
              <Btn onClick={()=>setShowSetup(false)} variant="ghost">Cancel</Btn>
            </div>
          </div>
        </div>
      )}

      <div style={S.tabBar}>
        {tabs.map(([id,lbl])=>(
          <button key={id} style={S.tab(tab===id)} onClick={()=>setTab(id)}>{lbl}</button>
        ))}
      </div>

      {tab==="review" && (
        <div>
          <div style={{...S.card,background:"#0e0e20",display:"flex",justifyContent:"space-between"}}>
            <div>
              <div style={{fontSize:12,color:"#555"}}>Week of</div>
              <div style={{fontSize:15,fontWeight:700}}>{new Date(weekKey).toLocaleDateString("en-GB",{day:"numeric",month:"long"})}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:26,fontWeight:700,color:"#F4C542"}}>{completed}/3</div>
              <div style={{fontSize:11,color:"#555"}}>ready</div>
            </div>
          </div>

          <SlotCard 
            slot={slots[0]} 
            label="Contemporary 1" 
            badge="New" 
            color="#4ECDC4" 
            updateSlot={(f,v)=>updateSlot("c1",f,v)} 
            rollRS={null}
            getTracklist={sp.getTracklist}
            searchFn={sp.token?sp.searchAlbums:null}
          />
          <SlotCard 
            slot={slots[1]} 
            label="Contemporary 2" 
            badge="New" 
            color="#45B7D1" 
            updateSlot={(f,v)=>updateSlot("c2",f,v)} 
            rollRS={null}
            getTracklist={sp.getTracklist}
            searchFn={sp.token?sp.searchAlbums:null}
          />
          <SlotCard 
            slot={slots[2]} 
            label="RS500 Pick" 
            badge="Classic" 
            color="#F4C542" 
            updateSlot={(f,v)=>updateSlot("rs",f,v)} 
            rollRS={rollRS}
            getTracklist={sp.getTracklist}
            searchFn={sp.token?sp.searchAlbums:null}
          />

          {completed>0 && (
            <Btn onClick={submit} variant="primary" style={{width:"100%",marginTop:20,padding:14,fontSize:15}}>
              Save {completed} Review{completed!==1?"s":""} →
            </Btn>
          )}
        </div>
      )}

      {tab==="history" && (
        <div>
          {reviews.length===0
            ? <div style={{...S.card,textAlign:"center",padding:40,color:"#555"}}>
                <div style={{fontSize:36,marginBottom:12}}>📀</div>No reviews yet.
              </div>
            : [...reviews].reverse().map(r=>(
              <div key={r.id} style={{...S.card,display:"flex",gap:12}}>
                <AlbumArt src={r.image} size={52}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",justifyContent:"space-between",gap:4}}>
                    <strong style={{fontSize:14}}>{r.album}</strong>
                    <div style={{display:"flex",gap:8}}>
                      <span style={{color:"#F4C542",fontWeight:700,fontSize:14}}>{r.rating}/10</span>
                      <button onClick={()=>del(r.id)} style={{background:"none",border:"none",color:"#444",cursor:"pointer"}}>×</button>
                    </div>
                  </div>
                  <div style={{color:"#777",fontSize:12,marginTop:2}}>{r.artist}</div>
                  <div style={{display:"flex",gap:5,marginTop:6,flexWrap:"wrap"}}>
                    <Pill>{r.year}</Pill>
                    {r.rs500Rank&&<Pill color="#2a2000">RS500 #{r.rs500Rank}</Pill>}
                  </div>
                  {r.topTracks?.length>0 && (
                    <div style={{marginTop:6,display:"flex",flexWrap:"wrap",gap:4}}>
                      {r.topTracks.map(t=><span key={t} style={{fontSize:11,color:"#F4C542"}}>★ {t}</span>)}
                    </div>
                  )}
                  {r.notes&&<p style={{color:"#666",fontSize:12,marginTop:6,marginBottom:0,fontStyle:"italic"}}>"{r.notes}"</p>}
                </div>
              </div>
            ))
          }
        </div>
      )}

      {tab==="covers" && (
        <div>
          {reviews.length===0
            ? <div style={{...S.card,textAlign:"center",padding:40,color:"#555"}}>
                <div style={{fontSize:36,marginBottom:12}}>🎨</div>No covers yet.
              </div>
            : <div style={{marginTop:14,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))",gap:12}}>
                {[...reviews].reverse().map(r=>(
                  <div key={r.id} style={{position:"relative",paddingTop:"100%",borderRadius:8,overflow:"hidden",background:"#1a1a2e"}}>
                    <div style={{position:"absolute",inset:0}}>
                      {r.image
                        ? <img src={r.image} alt={r.album} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                        : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32}}>💿</div>
                      }
                      <div style={{position:"absolute",bottom:0,left:0,right:0,background:"linear-gradient(transparent,rgba(0,0,0,.9))",
                        padding:"20px 6px 6px",fontSize:10,color:"#fff",fontWeight:600,lineHeight:1.2}}>
                        <div style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.album}</div>
                        <div style={{color:"#F4C542",marginTop:2}}>{r.rating}/10</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      )}

      {tab==="top4" && (
        <div>
          {["all","year"].map(which=>{
            const data = which==="all"?top4All:top4Year;
            const title = which==="all"?"Top 4 All Time":`Top 4 ${NOW_YEAR}`;
            return(
              <div key={which} style={{...S.card,background:"#1a1a2e",marginTop:which==="year"?16:14}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
                  <span style={{fontSize:11,textTransform:"uppercase",letterSpacing:2,color:"#555"}}>{title}</span>
                  <Btn onClick={()=>setEditTop4(editTop4===which?null:which)} variant="ghost" style={{padding:"5px 12px",fontSize:11}}>
                    {editTop4===which?"Done":"Edit"}
                  </Btn>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {data.map((rid,i)=>{
                    const r = rid ? reviews.find(x=>x.id===rid) : null;
                    return (
                      <div key={i} style={{position:"relative",paddingTop:"100%",borderRadius:8,overflow:"hidden",background:"#0f0f22",
                        border:editTop4===which?"2px dashed #F4C542":"none"}}>
                        <div style={{position:"absolute",inset:0}}>
                          {r ? (
                            <>
                              {r.image
                                ? <img src={r.image} alt={r.album} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                                : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:48}}>💿</div>
                              }
                              <div style={{position:"absolute",bottom:0,left:0,right:0,background:"linear-gradient(transparent,rgba(0,0,0,.95))",
                                padding:"30px 8px 8px",fontSize:11,color:"#fff",lineHeight:1.3}}>
                                <div style={{fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.album}</div>
                                <div style={{color:"#aaa",fontSize:10}}>{r.artist}</div>
                                <div style={{color:"#F4C542",marginTop:3,fontSize:12}}>{r.rating}/10</div>
                              </div>
                            </>
                          ) : (
                            <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",
                              fontSize:32,color:"#333"}}>+</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {editTop4===which && reviews.length>0 && (
                  <div style={{marginTop:12,maxHeight:200,overflowY:"auto"}}>
                    {reviews.map(r=>(
                      <div key={r.id} style={{padding:"6px 8px",background:"#0a0a18",borderRadius:6,marginBottom:4,cursor:"pointer",
                        display:"flex",alignItems:"center",gap:8}}
                        onClick={()=>{
                          const next = data.findIndex(x=>!x);
                          if (next!==-1) updateTop(which,next,r.id);
                        }}>
                        <AlbumArt src={r.image} size={32}/>
                        <div style={{flex:1,fontSize:12}}>
                          <div style={{fontWeight:600}}>{r.album}</div>
                          <div style={{color:"#777",fontSize:11}}>{r.artist}</div>
                        </div>
                        <span style={{color:"#F4C542",fontSize:12}}>{r.rating}/10</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab==="listen" && (
        <div>
          <div style={{...S.card,background:"#0e0e20"}}>
            <AlbumSearch searchFn={sp.token?sp.searchAlbums:null} onSelect={addLL}/>
          </div>
          {listenLater.length===0
            ? <div style={{...S.card,textAlign:"center",padding:40,color:"#555"}}>
                <div style={{fontSize:36,marginBottom:12}}>🎧</div>Nothing queued.
              </div>
            : listenLater.map((a,i)=>(
              <div key={i} style={{...S.card,display:"flex",gap:12,alignItems:"center"}}>
                <AlbumArt src={a.image} size={48}/>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:14}}>{a.album}</div>
                  <div style={{color:"#777",fontSize:12}}>{a.artist} · {a.year}</div>
                </div>
                <button onClick={()=>removeLL(i)} style={{background:"none",border:"none",color:"#555",cursor:"pointer",fontSize:18}}>×</button>
              </div>
            ))
          }
        </div>
      )}

      {tab==="wrap" && (
        <div>
          <div style={{marginTop:14,display:"flex",gap:8,flexWrap:"wrap"}}>
            <span style={{fontSize:13,color:"#666"}}>Year:</span>
            {(years.length>0?years:[NOW_YEAR]).map(y=>(
              <button key={y} onClick={()=>setWrapYear(y)}
                style={{padding:"5px 14px",borderRadius:20,border:`1px solid ${wrapYear===y?"#F4C542":"#2a2a4e"}`,
                  background:wrapYear===y?"#2a2000":"transparent",color:wrapYear===y?"#F4C542":"#666",cursor:"pointer",fontSize:13}}>{y}</button>
            ))}
          </div>
          {reviews.filter(r=>new Date(r.reviewedAt).getFullYear()===wrapYear).length===0
            ? <div style={{...S.card,textAlign:"center",padding:40,color:"#555"}}>
                <div style={{fontSize:36,marginBottom:12}}>🎵</div>No reviews for {wrapYear}.
              </div>
            : <div style={{...S.card}}>
                <div style={{fontSize:20,fontWeight:700,color:"#F4C542"}}>
                  {reviews.filter(r=>new Date(r.reviewedAt).getFullYear()===wrapYear).length} albums
                </div>
                <div style={{color:"#888",marginTop:4}}>
                  reviewed in {wrapYear}
                </div>
              </div>
          }
        </div>
      )}
    </div>
  );
}
