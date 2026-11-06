import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { LOCAL_DB } from "../../utils/data";
import type { Album, SearchFn } from "../../types";

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
    <div ref={ref} className="relative w-full">
      <Input
        value={q}
        onChange={(e) => search(e.target.value)}
        onFocus={() => q.length >= 2 && setOpen(true)}
        placeholder={placeholder}
        className="h-auto box-border px-3.5 py-2.5 text-sm"
      />
      {open && (
        <div className="absolute top-full right-0 left-0 z-[200] mt-1 max-h-[280px] overflow-y-auto rounded-lg border border-border bg-card shadow-xl">
          {results.map((r, i) => (
            <div
              key={i}
              onClick={() => {
                onSelect(r);
                setQ("");
                setOpen(false);
              }}
              className="flex cursor-pointer items-center gap-2.5 border-b border-muted px-3.5 py-2.5 last:border-b-0 hover:bg-accent"
            >
              {r.image && (
                <img
                  src={r.image}
                  alt=""
                  className="size-9 rounded-sm object-cover"
                />
              )}
              <div>
                <div className="text-sm font-semibold text-foreground">
                  {r.album}
                </div>
                <div className="text-xs text-muted-foreground">
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
