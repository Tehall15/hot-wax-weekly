import type { Album, Review, Slot } from "../types";

export const EMPTY = (): Slot[] => [
  { id: "c1", type: "contemporary", album: null, rating: 0, topTracks: [], notes: "" },
  { id: "c2", type: "contemporary", album: null, rating: 0, topTracks: [], notes: "" },
  { id: "rs", type: "rs500",        album: null, rating: 0, topTracks: [], notes: "" },
];

export function buildSlotsFromReviews(reviews: Review[], wk: string): Slot[] {
  const existing = reviews.filter(r => r.weekKey === wk);
  if (existing.length === 0) return EMPTY();

  const contemporaries = existing.filter(r => r.type === "contemporary");
  const rs = existing.find(r => r.type === "rs500");

  const toAlbum = (r: Review | undefined): Album | null => r
    ? { artist: r.artist, album: r.album, year: r.year, image: r.image, spotifyId: r.spotifyId }
    : null;

  const fromReview = (r: Review | undefined, empty: Slot): Slot => r
    ? { ...empty, album: toAlbum(r), rating: r.rating, topTracks: r.topTracks, notes: r.notes }
    : empty;

  const [e0, e1, e2] = EMPTY();
  return [
    fromReview(contemporaries[0], e0),
    fromReview(contemporaries[1], e1),
    fromReview(rs, e2),
  ];
}
