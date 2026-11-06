import { useState, useEffect, useRef } from "react";
import { LOCAL_DB } from "../../utils/data";
import type { Album, SearchFn } from "../../types";
import styles from "./AlbumSearch.module.css";

export default function AlbumSearch({
  onSelect,
  searchFn,
  placeholder = "Search artist or album…",
}: {
  onSelect: (a: Album) => void;
  searchFn?: SearchFn;
  placeholder?: string;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Album[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const search = async (val: string) => {
    setQ(val);
    if (val.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    let found: Album[] = [];
    if (searchFn) found = await searchFn(val);
    if (!found || found.length === 0) {
      const low = val.toLowerCase();
      found = LOCAL_DB.filter(
        (a) =>
          a.artist.toLowerCase().includes(low) ||
          a.album.toLowerCase().includes(low),
      ).slice(0, 8);
    }
    setResults(found);
    setOpen(found.length > 0);
  };

  return (
    <div ref={ref} className={styles.root}>
      <input
        value={q}
        onChange={(e) => search(e.target.value)}
        onFocus={() => q.length >= 2 && setOpen(true)}
        placeholder={placeholder}
        className={styles.input}
      />
      {open && (
        <div className={styles.results}>
          {results.map((r, i) => (
            <div
              key={i}
              onClick={() => {
                onSelect(r);
                setQ("");
                setOpen(false);
              }}
              className={styles.result}
            >
              {r.image && (
                <img src={r.image} alt="" className={styles.image} />
              )}
              <div>
                <div className={styles.albumName}>{r.album}</div>
                <div className={styles.artistName}>
                  {r.artist} · {r.year}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
