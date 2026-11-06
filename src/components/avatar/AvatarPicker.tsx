import { useState, useRef, type ChangeEvent } from "react";
import AlbumSearch from "../album/AlbumSearch";
import AvatarDisplay from "./AvatarDisplay";
import type { SpotifyApi } from "../../hooks/useSpotify";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[320px] max-w-[calc(100%-2rem)] gap-4">
        <DialogHeader className="pr-6">
          <DialogTitle>Set your avatar</DialogTitle>
        </DialogHeader>

        <div className="mb-1 flex justify-center">
          <AvatarDisplay avatar={preview} name={displayName} size={72} />
        </div>

        <Tabs value={tab} onValueChange={(value) => value && setTab(value)}>
          <TabsList className="w-full">
            <TabsTrigger value="emoji">Emoji</TabsTrigger>
            <TabsTrigger value="album">Album art</TabsTrigger>
            <TabsTrigger value="photo">Photo</TabsTrigger>
          </TabsList>
        </Tabs>

        {tab === "emoji" && (
          <div className="flex flex-wrap gap-1">
            {EMOJIS.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="icon"
                className={`size-9 text-xl ${preview === emoji ? "bg-primary/15 ring-1 ring-primary" : ""}`}
                onClick={() => setPreview(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        )}

        {tab === "album" && (
          <div>
            {sp?.token ? (
              <AlbumSearch
                searchFn={sp.searchAlbums}
                onSelect={(a) => setPreview(a.image)}
                placeholder="Search for an album…"
              />
            ) : (
              <div className="py-5 text-center text-xs text-muted-foreground">
                Connect Spotify to search album art
              </div>
            )}
          </div>
        )}

        {tab === "photo" && (
          <div className="py-2.5 text-center">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileRef.current?.click()}
            >
              Choose photo
            </Button>
            <div className="mt-2 text-[11px] text-muted-foreground">
              JPG or PNG, cropped to circle
            </div>
          </div>
        )}

        <Button className="mt-1 w-full" onClick={() => onSave(preview || null)}>
          Save avatar
        </Button>
      </DialogContent>
    </Dialog>
  );
}
