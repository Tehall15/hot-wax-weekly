import type { Album, Review, Top4 } from "../../types";

export type Which = "all" | "year";

export interface Top4Props {
  top4All: Top4;
  top4Year: Top4;
  editTop4: Which | null;
  setEditTop4: (which: Which | null) => void;
  updateTop: (which: Which, idx: number, album: Album | null) => void;
  swapTop: (which: Which, fromIdx: number, toIdx: number) => void;
}

export function resolveSlot(
  item: Album | string | null | undefined,
  reviews: Review[],
): Album | null {
  if (!item) return null;
  if (typeof item === "object") return item;
  const r = reviews.find((x) => x.id === item);
  return r
    ? {
        artist: r.artist,
        album: r.album,
        image: r.image,
        spotifyId: r.spotifyId,
      }
    : null;
}
