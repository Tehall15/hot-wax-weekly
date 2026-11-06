import type { KeyboardEvent } from "react";
import AvatarDisplay from "../avatar/AvatarDisplay";
import { Btn } from "../ui";
import RecordIcon from "./RecordIcon";
import styles from "./Header.module.css";

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
    <header className={styles.header}>
      <h1 className={styles.title}>🔥 Hot Wax Weekly</h1>
      {editingName ? (
        <div className={styles.nameEditor}>
          <input
            value={nameInput}
            onChange={(event) => onNameInputChange(event.target.value)}
            onKeyDown={onNameKeyDown}
            autoFocus
            placeholder="Your name"
            className={styles.nameInput}
          />
          <button onClick={onSaveName} className={styles.saveButton}>
            Save
          </button>
          <button onClick={onCancelNameEdit} className={styles.cancelButton}>
            ×
          </button>
        </div>
      ) : (
        <div className={styles.profileRow}>
          <AvatarDisplay
            avatar={avatar}
            name={displayName}
            size={32}
            onClick={onAvatarClick}
            muted
          />
          <p className={styles.journalLabel}>
            {journalLabel}
            <button
              onClick={onEditName}
              className={styles.editNameButton}
            >
              ✎
            </button>
          </p>
        </div>
      )}
      <div className={styles.actionRow}>
        <RecordIcon count={notificationCount} onClick={onOpenFriends} />
        {profileUrl && (
          <button
            onClick={onShareProfile}
            title={profileUrl}
            className={styles.actionButton}
          >
            <span className={styles.actionIcon}>🎤</span>
            <span className={styles.actionLabel}>Share profile</span>
          </button>
        )}
        <button onClick={onSignOut} className={styles.actionButton}>
          <span className={styles.actionIcon}>🤘</span>
          <span className={styles.actionLabel}>Sign out</span>
        </button>
      </div>
      <div className={styles.spotifyRow}>
        {spotifyConnected ? (
          <span className={styles.spotifyConnected}>● Spotify connected</span>
        ) : spotifyExpired ? (
          <div className={styles.spotifyExpired}>
            <span className={styles.spotifyDisconnected}>
              ● Spotify disconnected
            </span>
            <div className={styles.spotifyReconnectButton}>
              <Btn onClick={onSpotifyReconnect} variant="spotify">
                Reconnect
              </Btn>
            </div>
          </div>
        ) : (
          <div className={styles.spotifyConnectButton}>
            <Btn onClick={onSpotifyLogin} variant="spotify">
              Connect Spotify
            </Btn>
          </div>
        )}
      </div>
      <div className={styles.tabBar}>
        {tabs.map(([id, label]) => (
          <button
            key={id}
            className={`${styles.tab} ${selectedTab === id ? styles.activeTab : ""}`}
            onClick={() => onTabChange(id)}
          >
            {label}
          </button>
        ))}
      </div>
    </header>
  );
}
