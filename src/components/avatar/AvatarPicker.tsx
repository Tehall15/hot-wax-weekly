import { useState, useRef, type ChangeEvent } from "react";
import AlbumSearch from "../album/AlbumSearch";
import AvatarDisplay from "./AvatarDisplay";
import type { SpotifyApi } from "../../hooks/useSpotify";
import { Modal } from "../ui";
import styles from "./AvatarPicker.module.css";

const EMOJIS = [
  "🎵",
  "🎸",
  "🎹",
  "🥁",
  "🎺",
  "🎻",
  "🎤",
  "🎧",
  "💿",
  "📻",
  "🔥",
  "✨",
  "🎶",
  "🎼",
  "🎷",
  "🤘",
  "⚡",
  "🌟",
  "💫",
  "🌈",
  "🦋",
  "🐙",
  "👽",
  "🤖",
  "🦄",
  "🍄",
  "🌙",
  "⭐",
  "🎃",
  "🏆",
];

function resizeImage(file: File, size = 200): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const s = Math.min(img.width, img.height);
        ctx.drawImage(
          img,
          (img.width - s) / 2,
          (img.height - s) / 2,
          s,
          s,
          0,
          0,
          size,
          size,
        );
        resolve(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function AvatarPicker({
  currentAvatar,
  displayName,
  sp,
  onSave,
  onClose,
}: {
  currentAvatar?: string | null;
  displayName?: string | null;
  sp?: SpotifyApi;
  onSave: (avatar: string | null) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState("emoji");
  const [preview, setPreview] = useState<string | null | undefined>(
    currentAvatar,
  );
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = await resizeImage(file);
    setPreview(data);
  };

  return (
    <Modal title="Set your avatar" onClose={onClose} variant="dialog" width={320} headerGap={16}>
        {/* Preview */}
        <div
          className={styles.preview}
        >
          <AvatarDisplay avatar={preview} name={displayName} size={72} />
        </div>

        {/* Tabs */}
        <div
          className={styles.tabs}
        >
          {[
            ["emoji", "Emoji"],
            ["album", "Album art"],
            ["photo", "Photo"],
          ].map(([id, lbl]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`${styles.tab} ${tab === id ? styles.activeTab : ""}`}
            >
              {lbl}
            </button>
          ))}
        </div>

        {/* Emoji grid */}
        {tab === "emoji" && (
          <div className={styles.emojiGrid}>
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setPreview(e)}
                className={`${styles.emoji} ${preview === e ? styles.selectedEmoji : ""}`}
              >
                {e}
              </button>
            ))}
          </div>
        )}

        {/* Album art */}
        {tab === "album" && (
          <div>
            {sp?.token ? (
              <AlbumSearch
                searchFn={sp.searchAlbums}
                onSelect={(a) => setPreview(a.image)}
                placeholder="Search for an album…"
              />
            ) : (
              <div
                className={styles.spotifyMessage}
              >
                Connect Spotify to search album art
              </div>
            )}
          </div>
        )}

        {/* Photo upload */}
        {tab === "photo" && (
          <div className={styles.photoSection}>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              className={styles.hiddenInput}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className={styles.choosePhoto}
            >
              Choose photo
            </button>
            <div className={styles.photoHint}>
              JPG or PNG, cropped to circle
            </div>
          </div>
        )}

        {/* Save */}
        <button
          onClick={() => onSave(preview || null)}
          className={styles.saveButton}
        >
          Save avatar
        </button>
    </Modal>
  );
}
