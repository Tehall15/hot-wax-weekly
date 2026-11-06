import { useState, useEffect } from "react";
import AlbumArt from "@/components/ui/AlbumArt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import StarRating from "@/components/ui/StarRating";
import { Textarea } from "@/components/ui/textarea";
import AlbumSearch from "./AlbumSearch";
import TrackPicker from "./TrackPicker";
import type {
  Album,
  SearchFn,
  Slot,
  SlotField,
  Track,
  TracklistFn,
} from "../../types";

interface Props {
  slot: Slot;
  label: string;
  badge: string;
  color: string;
  updateSlot: (
    field: SlotField,
    value: Album | number | string | string[] | null,
  ) => void;
  rollRS?: () => void;
  getTracklist?: TracklistFn;
  searchFn?: SearchFn;
}

export default function SlotCard({
  slot,
  label,
  badge,
  color,
  updateSlot,
  rollRS,
  getTracklist,
  searchFn,
}: Props) {
  const [tracks, setTracks] = useState<Track[]>([]);

  useEffect(() => {
    if (!slot.album?.spotifyId || !getTracklist) return;
    let cancelled = false;
    getTracklist(slot.album.spotifyId).then((t) => {
      if (!cancelled && t?.length) setTracks(t);
    });
    return () => {
      cancelled = true;
    };
  }, [slot.album?.spotifyId, getTracklist]);

  return (
    <div
      className="mt-3.5 rounded-xl border border-border border-l-[3px] bg-card p-4.5"
      style={{ borderLeftColor: color }}
    >
      <div className="mb-3 flex justify-between">
        <span className="text-[11px] tracking-[2px] text-muted-foreground uppercase">
          {label}
        </span>
        <Badge variant="outline" style={{ backgroundColor: `${color}22`, color }}>
          {badge}
        </Badge>
      </div>

      {slot.id === "rs" && !slot.album && (
        <>
          <div className="mb-2 flex">
            <Button onClick={rollRS} variant="ghost" className="w-full justify-start whitespace-normal text-left">
              🎲 Random pick from Rolling Stone's 500 Greatest Albums
            </Button>
          </div>
          <AlbumSearch
            searchFn={searchFn}
            onSelect={(a) => updateSlot("album", a)}
          />
        </>
      )}

      {slot.id === "rs" && slot.album && (
        <div className="mb-3 flex gap-2.5">
          <AlbumArt src={slot.album.image} size={44} />
          <div className="min-w-0 flex-1">
            <div className="font-bold">{slot.album.album}</div>
            <div className="text-xs text-muted-foreground">{slot.album.artist}</div>
          </div>
          <div className="flex">
            <Button onClick={rollRS} variant="ghost" size="sm" className="px-2.5 text-[11px]">
              🎲
            </Button>
          </div>
        </div>
      )}

      {slot.id !== "rs" && (
        <div className="mb-3">
          <AlbumSearch
            searchFn={searchFn}
            onSelect={(a) => updateSlot("album", a)}
          />
          {slot.album && (
            <div className="mt-2 flex gap-2.5 rounded-lg bg-muted p-2">
              <AlbumArt src={slot.album.image} size={40} />
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{slot.album.album}</div>
                <div className="text-xs text-muted-foreground">{slot.album.artist}</div>
              </div>
              <Button
                onClick={() => updateSlot("album", null)}
                variant="ghost"
                size="icon-sm"
                aria-label="Clear selected album"
                className="text-muted-foreground"
              >
                ×
              </Button>
            </div>
          )}
        </div>
      )}

      {slot.album && (
        <>
          <div className="mb-3.5">
            <div className="mb-2 text-[11px] tracking-[2px] text-muted-foreground uppercase">
              Rating
            </div>
            <StarRating
              value={slot.rating || 0}
              onChange={(v) => updateSlot("rating", v)}
            />
          </div>
          <div className="mb-3.5">
            <TrackPicker
              tracks={tracks}
              selectedTracks={slot.topTracks || []}
              onChange={(v) => updateSlot("topTracks", v)}
            />
          </div>
          <div>
            <div className="mb-1.5 text-[11px] tracking-[2px] text-muted-foreground uppercase">
              Notes
            </div>
            <Textarea
              value={slot.notes || ""}
              onChange={(e) => updateSlot("notes", e.target.value)}
              placeholder="Thoughts…"
              className="h-[68px] min-h-0 resize-none px-3 py-2 text-[13px]"
            />
          </div>
        </>
      )}
    </div>
  );
}
