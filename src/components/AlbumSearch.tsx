import { useState, useEffect, useRef } from "react";
import { LOCAL_DB } from "../utils/data";
import type { Album, SearchFn } from "../types";

export default function AlbumSearch({ onSelect, searchFn, placeholder = "Search artist or album…" }: {
  onSelect: (a: Album) => void;
  searchFn?: SearchFn;
  placeholder?: string;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Album[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const search = async (val: string) => {
    setQ(val);
    if (val.length < 2) { setResults([]); setOpen(false); return; }
    let found: Album[] = [];
    if (searchFn) found = await searchFn(val);
    if (!found || found.length === 0) {
      const low = val.toLowerCase();
      found = LOCAL_DB.filter(a =>
        a.artist.toLowerCase().includes(low) || a.album.toLowerCase().includes(low)
      ).slice(0, 8);
    }
    setResults(found);
    setOpen(found.length > 0);
  };

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <input value={q} onChange={e => search(e.target.value)}
        onFocus={() => q.length >= 2 && setOpen(true)}
        placeholder={placeholder}
        style={{ width: "100%", background: "#1a1a2e", border: "1px solid #333", borderRadius: 8,
          padding: "10px 14px", color: "#e0e0f0", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 200, background: "#12122a",
          border: "1px solid #333", borderRadius: 8, marginTop: 4, maxHeight: 280, overflowY: "auto",
          boxShadow: "0 12px 40px rgba(0,0,0,.6)" }}>
          {results.map((r, i) => (
            <div key={i} onClick={() => { onSelect(r); setQ(""); setOpen(false); }}
              style={{ padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center",
                gap: 10, borderBottom: "1px solid #1a1a2e" }}
              onMouseEnter={e => e.currentTarget.style.background = "#1e1e3a"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              {r.image && <img src={r.image} alt="" style={{ width: 36, height: 36, borderRadius: 4 }} />}
              <div>
                <div style={{ color: "#e0e0f0", fontSize: 14, fontWeight: 600 }}>{r.album}</div>
                <div style={{ color: "#777", fontSize: 12 }}>{r.artist} · {r.year}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
