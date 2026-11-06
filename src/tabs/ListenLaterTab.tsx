import AlbumArt from "@/components/ui/AlbumArt";
import { Button } from "@/components/ui/button";
import AlbumSearch from "../components/album/AlbumSearch";
import type { SpotifyApi } from "../hooks/useSpotify";
import type { Album, ListenLaterItem } from "../types";

export default function ListenLaterTab({
  listenLater,
  addLL,
  removeLL,
  sp,
  onMoveToReview,
}: {
  listenLater: ListenLaterItem[];
  addLL: (album: Album) => void;
  removeLL: (idx: number) => void;
  sp: SpotifyApi;
  onMoveToReview: (album: Album, idx: number) => void;
}) {
  return (
    <div>
      <div className="mt-4 rounded-xl border border-border bg-card p-4">
        <AlbumSearch
          searchFn={sp.token ? sp.searchAlbums : undefined}
          onSelect={addLL}
        />
      </div>
      {listenLater.length === 0 ? (
        <div className="mt-4 rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
          <div className="mb-3 text-4xl">🎧</div>Nothing queued.
        </div>
      ) : (
        listenLater.map((a, i) => (
          <div
            key={i}
            className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-card p-4"
          >
            <AlbumArt src={a.image} size={48} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{a.album}</div>
              <div className="text-xs text-muted-foreground">
                {a.artist}
                {a.year ? ` · ${a.year}` : ""}
              </div>
            </div>
            <Button
              onClick={() => onMoveToReview(a, i)}
              variant="outline"
              size="sm"
              className="shrink-0 whitespace-nowrap text-xs"
            >
              + This Week
            </Button>
            <Button
              onClick={() => removeLL(i)}
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove ${a.album} from listen later`}
              className="shrink-0 text-muted-foreground"
            >
              ×
            </Button>
          </div>
        ))
      )}
    </div>
  );
}
