import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";
import { generateRandomString, sha256, base64encode } from "../utils/pkce";
import type { Album, Track } from "../types";

interface SpotifyAlbumItem {
  id: string;
  name: string;
  artists: { name: string }[];
  release_date?: string;
  images?: { url: string }[];
}

interface SpotifyAlbumsResponse {
  albums?: { items?: SpotifyAlbumItem[] };
}

interface SpotifyTracksResponse {
  items?: { name: string }[];
}

const toAlbum = (a: SpotifyAlbumItem): Album => ({
  spotifyId: a.id,
  artist: a.artists[0]?.name || "",
  album: a.name,
  year: parseInt(a.release_date?.split("-")[0] ?? "") || 0,
  image: a.images?.[1]?.url || a.images?.[0]?.url || null,
});

const REDIRECT = "https://hot-wax-weekly-8e4u-nu.vercel.app";

export default function useSpotify(clientId: string | undefined, user: User | null) {
  const [token, setToken] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const refreshTokenRef = useRef<string | null>(null);
  // Persistent cache: survives page refreshes — keyed by spotifyId
  const persistentCache = useRef<Record<string, Track[]> | null>(null);
  if (persistentCache.current === null) {
    try { persistentCache.current = JSON.parse(localStorage.getItem("hww_tracks") || "{}"); }
    catch { persistentCache.current = {}; }
  }
  // In-flight cache: deduplicates concurrent requests within a session
  const inflightCache = useRef(new Map<string, Promise<Track[]>>());

  // Effect C: Spotify OAuth callback — runs once on mount, fully isolated
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const codeVerifier = localStorage.getItem("code_verifier");
    if (!code || !codeVerifier) return;

    window.history.replaceState({}, document.title, window.location.pathname);
    localStorage.removeItem("code_verifier");

    fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId ?? "",
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT,
        code_verifier: codeVerifier,
      }),
    })
      .then(r => r.json())
      .then((data: { access_token?: string; refresh_token?: string }) => {
        if (!data.access_token) return;
        setToken(data.access_token);
        if (data.refresh_token) {
          refreshTokenRef.current = data.refresh_token;
          localStorage.setItem("spotify_refresh_token", data.refresh_token);
        }
        // Use update (not upsert) — never touches the data column
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (!user) return;
          supabase.from("app_data")
            .update({
              spotify_token: data.access_token,
              spotify_connected: true,
              spotify_refresh_token: data.refresh_token ?? null,
            })
            .eq("id", user.id)
            .then(
              res => { if (res.error) console.error("[spotify connect error]", res.error); },
              console.error,
            );
        });
      })
      .catch(err => console.error("[spotify token exchange failed]", err));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Effect D: Spotify token restore — isolated, depends only on user
  useEffect(() => {
    if (!user) return;
    supabase.from("app_data")
      .select("spotify_token, spotify_refresh_token")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) { console.error("[spotify restore error]", error); return; }
        // Restore refresh token: Supabase is source of truth, localStorage as fallback
        const rt = data?.spotify_refresh_token || localStorage.getItem("spotify_refresh_token");
        if (rt) {
          refreshTokenRef.current = rt;
          localStorage.setItem("spotify_refresh_token", rt);
        }
        if (data?.spotify_token) setToken(data.spotify_token);
      })
      .then(undefined, err => console.error("[spotify restore failed]", err));
  }, [user]);

  const refreshAccessToken = async (): Promise<string | null> => {
    const rt = refreshTokenRef.current;
    if (!rt) return null;
    try {
      const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: rt,
          client_id: clientId ?? "",
        }),
      });
      const data = await res.json() as { access_token?: string; refresh_token?: string };
      if (data.access_token) {
        setToken(data.access_token);
        const newRt = data.refresh_token || refreshTokenRef.current;
        if (newRt) {
          refreshTokenRef.current = newRt;
          localStorage.setItem("spotify_refresh_token", newRt);
        }
        // Persist refreshed tokens back to Supabase
        if (user) {
          supabase.from("app_data")
            .update({ spotify_token: data.access_token, spotify_refresh_token: newRt ?? null })
            .eq("id", user.id)
            .then(r => { if (r.error) console.error("[spotify refresh persist error]", r.error); });
        }
        return data.access_token;
      }
      setToken(null);
      return null;
    } catch {
      setToken(null);
      return null;
    }
  };

  const login = async () => {
    if (!clientId) return;
    const codeVerifier = generateRandomString(64);
    const codeChallenge = base64encode(await sha256(codeVerifier));
    localStorage.setItem("code_verifier", codeVerifier);
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: REDIRECT,
      scope: "user-read-private",
      code_challenge_method: "S256",
      code_challenge: codeChallenge,
    });
    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
  };

  const api = async <T,>(path: string, currentToken: string | null = token): Promise<T | null> => {
    if (!currentToken) return null;
    try {
      const r = await fetch(`https://api.spotify.com/v1/${path}`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (r.status === 401) {
        const newToken = await refreshAccessToken();
        if (!newToken) { setExpired(true); return null; }
        const r2 = await fetch(`https://api.spotify.com/v1/${path}`, {
          headers: { Authorization: `Bearer ${newToken}` },
        });
        if (!r2.ok) return null;
        return await r2.json() as T;
      }
      if (r.status === 429) {
        // Retry up to 3 times with Retry-After backoff
        let last = r;
        for (let i = 0; i < 3; i++) {
          const wait = parseInt(last.headers.get("Retry-After") || "3", 10);
          await new Promise(res => setTimeout(res, wait * 1000));
          const retry = await fetch(`https://api.spotify.com/v1/${path}`, {
            headers: { Authorization: `Bearer ${currentToken}` },
          });
          if (retry.status !== 429) {
            if (!retry.ok) return null;
            return await retry.json() as T;
          }
          last = retry;
        }
        return null;
      }
      if (!r.ok) return null;
      return await r.json() as T;
    } catch { return null; }
  };

  const searchAlbums = useCallback(async (q: string): Promise<Album[]> => {
    if (!token || !q) return [];
    const data = await api<SpotifyAlbumsResponse>(`search?q=${encodeURIComponent(q)}&type=album&limit=8`);
    if (!data?.albums?.items) return [];
    return data.albums.items.map(toAlbum);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const getTracklist = useCallback((spotifyId: string): Promise<Track[]> => {
    if (!token || !spotifyId) return Promise.resolve([]);
    // 1. Persistent cache hit — no API call at all
    const cache = persistentCache.current ?? {};
    if (cache[spotifyId]) return Promise.resolve(cache[spotifyId]);
    // 2. In-flight dedup — reuse existing request for same album
    if (!inflightCache.current.has(spotifyId)) {
      const p = api<SpotifyTracksResponse>(`albums/${spotifyId}/tracks?limit=50`)
        .then(data => {
          const tracks = data?.items?.map((t, i): Track => ({ num: i + 1, name: t.name })) || [];
          if (tracks.length > 0) {
            cache[spotifyId] = tracks;
            persistentCache.current = cache;
            try { localStorage.setItem("hww_tracks", JSON.stringify(cache)); }
            catch {} // storage full — non-fatal
          } else {
            inflightCache.current.delete(spotifyId); // don't cache failures so retry is possible
          }
          return tracks;
        });
      inflightCache.current.set(spotifyId, p);
    }
    return inflightCache.current.get(spotifyId) ?? Promise.resolve([]);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const getNewReleases = useCallback(async (): Promise<Album[]> => {
    if (!token) return [];
    const data = await api<SpotifyAlbumsResponse>("browse/new-releases?limit=20&country=GB");
    if (!data?.albums?.items) return [];
    return data.albums.items.map(toAlbum);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const disconnect = () => {
    setToken(null);
    setExpired(false);
    refreshTokenRef.current = null;
    localStorage.removeItem("spotify_refresh_token");
    if (user) {
      supabase.from("app_data")
        .update({ spotify_token: null, spotify_refresh_token: null, spotify_connected: false })
        .eq("id", user.id)
        .then(r => { if (r.error) console.error("[spotify disconnect error]", r.error); });
    }
  };

  return { token, expired, login, disconnect, searchAlbums, getTracklist, getNewReleases };
}

export type SpotifyApi = ReturnType<typeof useSpotify>;
