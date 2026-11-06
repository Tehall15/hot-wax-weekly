export interface Album {
  artist: string;
  album: string;
  year?: number | null;
  image?: string | null;
  spotifyId?: string | null;
  rs500Rank?: number | null;
  rank?: number;
}

export interface Track {
  num: number;
  name: string;
}

export type SlotType = "contemporary" | "rs500";

export interface Slot {
  id: string;
  type: SlotType;
  album: Album | null;
  rating: number;
  topTracks: string[];
  notes: string;
}

export type SlotField = "album" | "rating" | "topTracks" | "notes";

export type ReviewType = SlotType | "past";

export interface Review {
  id: string;
  weekKey: string;
  type: ReviewType;
  artist: string;
  album: string;
  year?: number | null;
  image?: string | null;
  spotifyId?: string | null;
  rating: number;
  topTracks: string[];
  notes: string;
  reviewedAt: string;
  rs500Rank?: number | null;
}

export interface ListenLaterItem extends Album {
  addedAt?: string;
}

export type Top4Item = Album | null;
export type Top4 = Top4Item[];

export interface AppDataBlob {
  reviews?: Review[];
  listenLater?: ListenLaterItem[];
  top4All?: (Top4Item | string)[];
  top4Year?: (Top4Item | string)[];
  avatar?: string | null;
}

export interface AppDataRow {
  id: string;
  display_name: string | null;
  data: AppDataBlob | null;
  spotify_token?: string | null;
  spotify_refresh_token?: string | null;
  spotify_connected?: boolean;
}

export type NotificationType = "follow" | "reaction" | "comment" | "recommendation";

export interface AppNotification {
  id?: string;
  user_id: string;
  type: NotificationType;
  from_user_id: string;
  from_display_name: string;
  read?: boolean;
  created_at?: string;
  metadata?: { album?: Album } & Record<string, unknown>;
}

export interface ReviewComment {
  id: string;
  review_id: string;
  user_id: string;
  display_name: string;
  body: string;
  created_at: string;
}

export interface ReactionRow {
  review_id: string;
  emoji: string;
  user_id: string;
}

export type SearchFn = (q: string) => Promise<Album[]>;
export type TracklistFn = (spotifyId: string) => Promise<Track[]>;

export type ProfileRow = Pick<AppDataRow, "id" | "display_name" | "data">;
