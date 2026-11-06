import type { KeyboardEvent } from "react";
import AvatarDisplay from "../avatar/AvatarDisplay";
import { Button } from "../ui/button";
import RecordIcon from "./RecordIcon";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";

export type HeaderTab = "review" | "hottest" | "collection" | "listen";

type Props = {
  displayName?: string;
  journalLabel: string;
  editingName: boolean;
  nameInput: string;
  onNameInputChange: (value: string) => void;
  onNameKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onSaveName: () => void;
  onCancelNameEdit: () => void;
  onEditName: () => void;
  avatar: string | null;
  onAvatarClick: () => void;
  notificationCount: number;
  onOpenFriends: () => void;
  profileUrl: string | null;
  onShareProfile: () => void;
  onSignOut: () => void;
  spotifyConnected: boolean;
  spotifyExpired: boolean;
  onSpotifyReconnect: () => void;
  onSpotifyLogin: () => void;
  selectedTab: HeaderTab | null;
  onTabChange: (tab: HeaderTab) => void;
};

const tabs: [HeaderTab, string][] = [
  ["review", "This Week"],
  ["hottest", "Hottest Wax"],
  ["collection", "Record Collection"],
  ["listen", "Listen Later"],
];

export default function Header({
  displayName,
  journalLabel,
  editingName,
  nameInput,
  onNameInputChange,
  onNameKeyDown,
  onSaveName,
  onCancelNameEdit,
  onEditName,
  avatar,
  onAvatarClick,
  notificationCount,
  onOpenFriends,
  profileUrl,
  onShareProfile,
  onSignOut,
  spotifyConnected,
  spotifyExpired,
  onSpotifyReconnect,
  onSpotifyLogin,
  selectedTab,
  onTabChange,
}: Props) {
  return (
    <header className="pt-7 text-center">
      <h1 className="m-0 text-[26px] font-bold">🔥 Hot Wax Weekly</h1>
      {editingName ? (
        <div className="mt-1.5 flex items-center justify-center gap-1.5">
          <Input
            value={nameInput}
            onChange={(event) => onNameInputChange(event.target.value)}
            onKeyDown={onNameKeyDown}
            autoFocus
            placeholder="Your name"
            className="h-7 w-40 bg-card text-[13px]"
          />
          <Button size="xs" onClick={onSaveName}>Save</Button>
          <Button size="icon-xs" variant="ghost" onClick={onCancelNameEdit} aria-label="Cancel editing name">×</Button>
        </div>
      ) : (
        <div className="mt-1.5 flex items-center justify-center gap-2">
          <AvatarDisplay
            avatar={avatar}
            name={displayName}
            size={32}
            onClick={onAvatarClick}
            muted
          />
          <p className="m-0 text-xs italic text-muted-foreground">
            {journalLabel}
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onEditName}
              aria-label="Edit name"
              className="ml-1.5 text-muted-foreground"
            >
              ✎
            </Button>
          </p>
        </div>
      )}
      <div className="mt-2.5 flex items-center justify-center gap-6">
        <RecordIcon count={notificationCount} onClick={onOpenFriends} />
        {profileUrl && (
          <Button
            variant="ghost"
            onClick={onShareProfile}
            title={profileUrl}
            className="h-auto flex-col gap-0.5 p-0"
          >
            <span className="text-xl leading-none">🎤</span>
            <span className="text-[9px] tracking-wide text-muted-foreground">Share profile</span>
          </Button>
        )}
        <Button variant="ghost" onClick={onSignOut} className="h-auto flex-col gap-0.5 p-0">
          <span className="text-xl leading-none">🤘</span>
          <span className="text-[9px] tracking-wide text-muted-foreground">Sign out</span>
        </Button>
      </div>
      <div className="mt-2 flex justify-center gap-2.5">
        {spotifyConnected ? (
          <span className="text-[11px] text-spotify">● Spotify connected</span>
        ) : spotifyExpired ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-destructive">● Spotify disconnected</span>
            <Button onClick={onSpotifyReconnect} variant="spotify" size="xs">
              Reconnect
            </Button>
          </div>
        ) : (
          <Button onClick={onSpotifyLogin} variant="spotify" size="xs">
            Connect Spotify
          </Button>
        )}
      </div>
      <div className="mt-5 flex gap-[3px] rounded-xl bg-muted p-[3px]" role="group" aria-label="Main navigation">
        {tabs.map(([id, label]) => (
          <Button
            key={id}
            type="button"
            variant="ghost"
            aria-pressed={selectedTab === id}
            className={cn(
              "h-auto min-w-0 flex-1 shrink whitespace-normal px-1 py-2 text-xs text-muted-foreground",
              selectedTab === id && "border-border bg-accent text-foreground",
            )}
            onClick={() => onTabChange(id)}
          >
            {label}
          </Button>
        ))}
      </div>
    </header>
  );
}
