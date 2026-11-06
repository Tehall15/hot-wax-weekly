import { useEffect, useState } from "react";
import AlbumArt from "@/components/ui/AlbumArt";
import { Button } from "@/components/ui/button";
import StarRating from "@/components/ui/StarRating";
import { Textarea } from "@/components/ui/textarea";
import AlbumSearch from "../../components/album/AlbumSearch";
import TrackPicker from "../../components/album/TrackPicker";
import type { SpotifyApi } from "../../hooks/useSpotify";
import type { Album, Track } from "../../types";

export type PastSaveFn = (
  album: Album,
  rating: number,
  topTracks: string[],
  notes: string,
) => void;

export default function PastReviewCard({
  sp,
  onSave,
}: {
  sp: SpotifyApi;
  onSave: PastSaveFn;
}) {
  const [album, setAlbum] = useState<Album | null>(null);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [topTracks, setTopTracks] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!album?.spotifyId || !sp?.getTracklist) return;
    let cancelled = false;
    sp.getTracklist(album.spotifyId).then((t) => {
      if (!cancelled && t?.length) setTracks(t);
    });
    return () => {
      cancelled = true;
    };
  }, [album?.spotifyId, sp?.getTracklist]);

  const reset = () => {
    setAlbum(null);
    setRating(0);
    setNotes("");
    setTracks([]);
    setTopTracks([]);
    setSaved(false);
  };

  const save = () => {
    if (!album || !rating) return;
    onSave(album, rating, topTracks, notes);
    setSaved(true);
    setTimeout(reset, 800);
  };

  return (
    <div className="mt-4 rounded-xl border border-border border-l-[3px] border-l-violet-500 bg-card p-4">
      <div className="mb-3 text-[11px] uppercase tracking-[2px] text-muted-foreground">
        Past Review
      </div>

      <AlbumSearch
        searchFn={sp?.token ? sp.searchAlbums : undefined}
        onSelect={(a) => {
          setAlbum(a);
          setRating(0);
          setNotes("");
          setTopTracks([]);
          setTracks([]);
        }}
      />

      {album && (
        <>
          <div className="mb-3.5 mt-2 flex items-center gap-2.5 rounded-lg bg-muted p-2">
            <AlbumArt src={album.image} size={40} />
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{album.album}</div>
              <div className="text-xs text-muted-foreground">
                {album.artist}
                {album.year ? ` · ${album.year}` : ""}
              </div>
            </div>
            <Button
              onClick={reset}
              variant="ghost"
              size="icon-sm"
              aria-label="Clear selected album"
              className="text-muted-foreground"
            >
              ×
            </Button>
          </div>

          <div className="mb-3.5">
            <div className="mb-2 text-[11px] uppercase tracking-[2px] text-muted-foreground">
              Rating
            </div>
            <StarRating value={rating} onChange={setRating} />
          </div>

          {tracks.length > 0 && (
            <div className="mb-3.5">
              <TrackPicker
                tracks={tracks}
                selectedTracks={topTracks}
                onChange={setTopTracks}
              />
            </div>
          )}

          <div className="mb-3.5">
            <div className="mb-1.5 text-[11px] uppercase tracking-[2px] text-muted-foreground">
              Notes
            </div>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Thoughts…"
              className="h-[68px] resize-none text-sm"
            />
          </div>

          <div className="w-full">
            <Button onClick={save} disabled={!rating} className="w-full">
              {saved ? "Saved ✓" : "Save Review"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
