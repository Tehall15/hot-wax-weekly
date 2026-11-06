import styles from "./AvatarDisplay.module.css";

interface Props {
  avatar?: string | null;
  name?: string | null;
  size?: number;
  onClick?: () => void;
  muted?: boolean;
}

export default function AvatarDisplay({
  avatar,
  name,
  size = 34,
  onClick,
  muted = false,
}: Props) {
  const isImage =
    avatar && (avatar.startsWith("http") || avatar.startsWith("data:"));
  const isEmoji = avatar && !isImage;

  return (
    <div
      onClick={onClick}
      className={`${styles.avatar} ${muted ? styles.muted : ""} ${onClick ? styles.clickable : ""}`}
      style={{ width: size, height: size }}
    >
      {isImage ? (
        <img src={avatar} alt="" className={styles.image} />
      ) : isEmoji ? (
        <span className={styles.emoji} style={{ fontSize: size * 0.48 }}>{avatar}</span>
      ) : (
        <span
          className={`${styles.initial} ${muted ? styles.mutedInitial : ""}`}
          style={{ fontSize: size * 0.42 }}
        >
          {name?.[0]?.toUpperCase() || "?"}
        </span>
      )}
    </div>
  );
}
