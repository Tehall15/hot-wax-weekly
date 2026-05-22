import { useState, useRef } from "react";
import AlbumSearch from "./AlbumSearch";
import AvatarDisplay from "./AvatarDisplay";

const EMOJIS = [
  "🎵","🎸","🎹","🥁","🎺","🎻","🎤","🎧","💿","📻",
  "🔥","✨","🎶","🎼","🎷","🤘","⚡","🌟","💫","🌈",
  "🦋","🐙","👽","🤖","🦄","🍄","🌙","⭐","🎃","🏆",
];

function resizeImage(file, size = 200) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext("2d");
        const s = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function AvatarPicker({ currentAvatar, displayName, sp, onSave, onClose }) {
  const [tab, setTab] = useState("emoji");
  const [preview, setPreview] = useState(currentAvatar);
  const fileRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const data = await resizeImage(file);
    setPreview(data);
  };

  return (
    <>
      <div onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", zIndex: 600 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        background: "#0d0d1a", border: "1px solid #1e1e3e", borderRadius: 14,
        zIndex: 700, width: 320, maxWidth: "92vw", padding: "20px 18px",
        boxShadow: "0 20px 60px rgba(0,0,0,.8)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Set your avatar</span>
          <button onClick={onClose}
            style={{ background: "none", border: "none", color: "#555", fontSize: 22, cursor: "pointer", padding: 0 }}>×</button>
        </div>

        {/* Preview */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <AvatarDisplay avatar={preview} name={displayName} size={72} />
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 14, background: "#0a0a18", borderRadius: 8, padding: 3 }}>
          {[["emoji","Emoji"],["album","Album art"],["photo","Photo"]].map(([id, lbl]) => (
            <button key={id} onClick={() => setTab(id)}
              style={{ flex: 1, padding: "5px 0", borderRadius: 6, border: "none", cursor: "pointer",
                fontSize: 11, fontWeight: 600,
                background: tab === id ? "#1a1a30" : "transparent",
                color: tab === id ? "#e0e0f0" : "#555" }}>
              {lbl}
            </button>
          ))}
        </div>

        {/* Emoji grid */}
        {tab === "emoji" && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {EMOJIS.map(e => (
              <button key={e} onClick={() => setPreview(e)}
                style={{ fontSize: 22, padding: "5px 7px", cursor: "pointer",
                  background: preview === e ? "#1a1a3e" : "transparent",
                  border: preview === e ? "1px solid #F4C542" : "1px solid transparent",
                  borderRadius: 8 }}>
                {e}
              </button>
            ))}
          </div>
        )}

        {/* Album art */}
        {tab === "album" && (
          <div>
            {sp?.token
              ? <AlbumSearch searchFn={sp.searchAlbums} onSelect={a => setPreview(a.image)} placeholder="Search for an album…" />
              : <div style={{ color: "#444", fontSize: 12, textAlign: "center", padding: "20px 0" }}>
                  Connect Spotify to search album art
                </div>
            }
          </div>
        )}

        {/* Photo upload */}
        {tab === "photo" && (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile}
              style={{ display: "none" }} />
            <button onClick={() => fileRef.current.click()}
              style={{ background: "#1a1a2e", border: "1px solid #2a2a4e", borderRadius: 8,
                padding: "10px 24px", color: "#aaa", fontSize: 12, cursor: "pointer" }}>
              Choose photo
            </button>
            <div style={{ fontSize: 11, color: "#333", marginTop: 8 }}>JPG or PNG, cropped to circle</div>
          </div>
        )}

        {/* Save */}
        <button onClick={() => onSave(preview || null)}
          style={{ marginTop: 16, width: "100%", background: "#F4C542", border: "none",
            borderRadius: 8, padding: "10px 0", color: "#0d0d1a", fontWeight: 700,
            fontSize: 13, cursor: "pointer" }}>
          Save avatar
        </button>
      </div>
    </>
  );
}
