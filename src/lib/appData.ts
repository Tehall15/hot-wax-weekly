import { z } from "zod";
import { supabase } from "./supabase";
import type { Album, ListenLaterItem, Review, Top4 } from "../types";

const albumSchema = z.object({
  artist: z.string(),
  album: z.string(),
  year: z.number().nullable().optional(),
  image: z.string().nullable().optional(),
  spotifyId: z.string().nullable().optional(),
  rs500Rank: z.number().nullable().optional(),
  rank: z.number().optional(),
}).passthrough();

const reviewSchema = albumSchema.extend({
  id: z.string(),
  weekKey: z.string(),
  type: z.enum(["contemporary", "rs500", "past"]),
  rating: z.number(),
  topTracks: z.array(z.string()),
  notes: z.string(),
  reviewedAt: z.string(),
});

const appDataSchema = z.object({
  reviews: z.array(reviewSchema).optional(),
  listenLater: z.array(albumSchema.extend({ addedAt: z.string().optional() })).optional(),
  top4All: z.array(z.union([albumSchema, z.string(), z.null()])).optional(),
  top4Year: z.array(z.union([albumSchema, z.string(), z.null()])).optional(),
  avatar: z.string().nullable().optional(),
}).passthrough();

export interface JournalData extends Record<string, unknown> {
  reviews: Review[];
  listenLater: ListenLaterItem[];
  top4All: Top4;
  top4Year: Top4;
  avatar: string | null;
}

export function emptyJournal(): JournalData {
  return {
    reviews: [],
    listenLater: [],
    top4All: [null, null, null, null],
    top4Year: [null, null, null, null],
    avatar: null,
  };
}

export function parseJournal(value: unknown): JournalData {
  if (value == null) return emptyJournal();
  const parsed = appDataSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error(`Invalid saved journal data: ${parsed.error.message}`);
  }
  const data = parsed.data;
  const reviews = data.reviews ?? [];
  const resolveTop4 = (items: (Album | string | null)[] | undefined): Top4 =>
    (items ?? [null, null, null, null]).map((item) => {
      if (typeof item !== "string") return item;
      const review = reviews.find((r) => r.id === item);
      return review
        ? { artist: review.artist, album: review.album, image: review.image, spotifyId: review.spotifyId }
        : null;
    });

  return {
    ...data,
    reviews,
    listenLater: data.listenLater ?? [],
    top4All: resolveTop4(data.top4All),
    top4Year: resolveTop4(data.top4Year),
    avatar: data.avatar ?? null,
  };
}

export async function loadJournal(userId: string): Promise<JournalData> {
  const { data, error } = await supabase
    .from("app_data")
    .select("data")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return parseJournal(data?.data);
}

export async function saveJournal(
  userId: string,
  displayName: string | null,
  journal: JournalData,
): Promise<void> {
  const { error } = await supabase
    .from("app_data")
    .upsert({ id: userId, display_name: displayName, data: journal });
  if (error) throw error;
}
