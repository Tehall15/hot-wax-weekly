import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { LOCAL_DB } from "../../utils/data";
import { NOW_YEAR } from "../../utils/time";
import type { SpotifyApi } from "../../hooks/useSpotify";
import type { Album, Review } from "../../types";
import { resolveSlot, type Top4Props, type Which } from "./shared";

function Top4Section({
  reviews,
  top4All,
  top4Year,
  editTop4,
  setEditTop4,
  updateTop,
  swapTop,
  sp,
}: Top4Props & {
  reviews: Review[];
  sp?: SpotifyApi;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Album[]>([]);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const search = async (val: string) => {
    setQ(val);
    if (val.length < 2) {
      setResults([]);
      return;
    }
    let found: Album[] = [];
    if (sp?.searchAlbums) found = (await sp.searchAlbums(val)) || [];
    if (!found.length) {
      const low = val.toLowerCase();
      found = LOCAL_DB.filter(
        (a) =>
          a.artist.toLowerCase().includes(low) ||
          a.album.toLowerCase().includes(low),
      ).slice(0, 6);
    }
    setResults(found);
  };

  const clearSearch = () => {
    setQ("");
    setResults([]);
  };

  return (
    <>
      {(["all"] as Which[]).map((which) => {
        const data = which === "all" ? top4All : top4Year;
        const title = which === "all" ? "Top 4 All Time" : `Top 4 ${NOW_YEAR}`;
        const isEditing = editTop4 === which;

        return (
          <section key={which} className="mt-3 rounded-xl border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {title}
              </h2>
              <Button
                onClick={() => {
                  setEditTop4(isEditing ? null : which);
                  clearSearch();
                }}
                variant="ghost"
                size="sm"
              >
                {isEditing ? "Done" : "Edit"}
              </Button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {data.map((item, i) => {
                const alb = resolveSlot(item, reviews);
                const isDragging = draggedIdx === i;
                const isDragOver = dragOverIdx === i && draggedIdx !== i;
                return (
                  <div
                    key={i}
                    draggable={!!alb}
                    onDragStart={() => {
                      setDraggedIdx(i);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverIdx(i);
                    }}
                    onDragLeave={() => setDragOverIdx(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedIdx !== null && draggedIdx !== i)
                        swapTop(which, draggedIdx, i);
                      setDraggedIdx(null);
                      setDragOverIdx(null);
                    }}
                    onDragEnd={() => {
                      setDraggedIdx(null);
                      setDragOverIdx(null);
                    }}
                    className={cn(
                      "relative aspect-square overflow-hidden rounded-lg border bg-muted transition-opacity",
                      isDragOver && "border-2 border-primary",
                      !isDragOver && isEditing && "border-2 border-dashed border-border",
                      !isDragOver && !isEditing && "border-border",
                      isDragging && "opacity-40",
                      alb ? "cursor-grab" : "cursor-default",
                    )}
                  >
                    {alb ? (
                      <>
                        {alb.image ? (
                          <img
                            src={alb.image}
                            alt={alb.album}
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center text-[22px]">
                            💿
                          </div>
                        )}
                        <div className="absolute left-1 top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                          {i + 1}
                        </div>
                        {isEditing && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => updateTop(which, i, null)}
                            aria-label={`Remove ${alb.album} from top four`}
                            className="absolute right-1 top-1 size-[18px] rounded-full bg-black/75 p-0 text-white hover:bg-black"
                          >
                            ×
                          </Button>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-1.5 pb-1 pt-3.5 text-[9px] leading-tight text-white">
                          <div className="truncate font-semibold">{alb.album}</div>
                        </div>
                      </>
                    ) : (
                      <div className="flex size-full items-center justify-center text-xl text-muted-foreground">
                        {isEditing ? "+" : ""}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {isEditing && (
              <div className="mt-3">
                <Input
                  value={q}
                  onChange={(e) => search(e.target.value)}
                  placeholder={
                    sp?.token ? "Search any album on Spotify…" : "Search album…"
                  }
                />
                {results.length > 0 && (
                  <div className="mt-1.5 max-h-[220px] overflow-y-auto">
                    {results.map((r, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => {
                          const next = data.findIndex(
                            (x) => !resolveSlot(x, reviews),
                          );
                          const slot = next !== -1 ? next : 0;
                          updateTop(which, slot, {
                            artist: r.artist,
                            album: r.album,
                            image: r.image || null,
                            spotifyId: r.spotifyId || null,
                          });
                          clearSearch();
                        }}
                        className="mb-1 flex w-full items-center gap-2.5 rounded-md bg-muted/50 p-2 text-left transition-colors hover:bg-accent"
                      >
                        {r.image ? (
                          <img
                            src={r.image}
                            alt=""
                            className="size-[38px] shrink-0 rounded object-cover"
                          />
                        ) : (
                          <div className="flex size-[38px] shrink-0 items-center justify-center rounded bg-muted text-base">
                            💿
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] font-semibold">
                            {r.album}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {r.artist}
                            {r.year ? ` · ${r.year}` : ""}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        );
      })}
    </>
  );
}

export default Top4Section;
