export const EMPTY = () => ([
  { id: "c1", type: "contemporary", album: null, rating: 0, topTracks: [], notes: "" },
  { id: "c2", type: "contemporary", album: null, rating: 0, topTracks: [], notes: "" },
  { id: "rs", type: "rs500",        album: null, rating: 0, topTracks: [], notes: "" },
]);

export function buildSlotsFromReviews(reviews, wk) {
  const existing = reviews.filter(r => r.weekKey === wk);
  if (existing.length === 0) return EMPTY();

  const contemporaries = existing.filter(r => r.type === "contemporary");
  const rs = existing.find(r => r.type === "rs500");

  const toAlbum = (r) => r
    ? { artist: r.artist, album: r.album, year: r.year, image: r.image, spotifyId: r.spotifyId }
    : null;

  const fromReview = (r, empty) => r
    ? { ...empty, album: toAlbum(r), rating: r.rating, topTracks: r.topTracks, notes: r.notes }
    : empty;

  const [e0, e1, e2] = EMPTY();
  return [
    fromReview(contemporaries[0], e0),
    fromReview(contemporaries[1], e1),
    fromReview(rs, e2),
  ];
}
