import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { generateRandomString, sha256, base64encode } from "../utils/pkce";

const REDIRECT = "https://hot-wax-weekly-8e4u-nu.vercel.app";

export default function useSpotify(clientId, user) {
  const [token, setToken] = useState(null);
  const refreshTokenRef = useRef(null);

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
        client_id: clientId,
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT,
        code_verifier: codeVerifier,
      }),
    })
      .then(r => r.json())
      .then(data => {
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
            .update({ spotify_token: data.access_token, spotify_connected: true })
            .eq("id", user.id)
            .then(res => { if (res.error) console.error("[spotify connect error]", res.error); })
            .catch(console.error);
        });
      })
      .catch(err => console.error("[spotify token exchange failed]", err));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Effect D: Spotify token restore — isolated, depends only on user
  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem("spotify_refresh_token");
    if (stored) refreshTokenRef.current = stored;
    supabase.from("app_data")
      .select("spotify_token")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) { console.error("[spotify restore error]", error); return; }
        if (data?.spotify_token) setToken(data.spotify_token);
      })
      .catch(err => console.error("[spotify restore failed]", err));
  }, [user]);

  const refreshAccessToken = async () => {
    const rt = refreshTokenRef.current;
    if (!rt) return null;
    try {
      const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: rt,
          client_id: clientId,
        }),
      });
      const data = await res.json();
      if (data.access_token) {
        setToken(data.access_token);
        if (data.refresh_token) {
          refreshTokenRef.current = data.refresh_token;
          localStorage.setItem("spotify_refresh_token", data.refresh_token);
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

  const api = async (path, currentToken = token) => {
    if (!currentToken) return null;
    try {
      const r = await fetch(`https://api.spotify.com/v1/${path}`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (r.status === 401) {
        const newToken = await refreshAccessToken();
        if (!newToken) return null;
        const r2 = await fetch(`https://api.spotify.com/v1/${path}`, {
          headers: { Authorization: `Bearer ${newToken}` },
        });
        if (!r2.ok) return null;
        return await r2.json();
      }
      return await r.json();
    } catch { return null; }
  };

  const searchAlbums = async (q) => {
    if (!token || !q) return [];
    const data = await api(`search?q=${encodeURIComponent(q)}&type=album&limit=8`);
    if (!data?.albums?.items) return [];
    return data.albums.items.map(a => ({
      spotifyId: a.id,
      artist: a.artists[0]?.name || "",
      album: a.name,
      year: parseInt(a.release_date?.split("-")[0]) || 0,
      image: a.images?.[1]?.url || a.images?.[0]?.url || null,
    }));
  };

  const getTracklist = async (spotifyId) => {
    if (!token || !spotifyId) return [];
    const data = await api(`albums/${spotifyId}/tracks?limit=50`);
    return data?.items?.map((t, i) => ({ num: i + 1, name: t.name })) || [];
  };

  const getNewReleases = async () => {
    if (!token) return [];
    const data = await api("browse/new-releases?limit=20&country=GB");
    if (!data?.albums?.items) return [];
    return data.albums.items.map(a => ({
      spotifyId: a.id,
      artist: a.artists[0]?.name || "",
      album: a.name,
      year: parseInt(a.release_date?.split("-")[0]) || 0,
      image: a.images?.[1]?.url || a.images?.[0]?.url || null,
    }));
  };

  return { token, login, searchAlbums, getTracklist, getNewReleases };
}
