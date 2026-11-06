import styles from "./AlbumArt.module.css";

export default function AlbumArt({
  src,
  size = 56,
  muted = false,
}: {
  src?: string | null;
  size?: number;
  muted?: boolean;
}) {
  return src ? (
    <img
      src={src}
      alt=""
      className={styles.img}
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className={`${styles.fallback} ${muted ? styles.muted : ""}`}
      style={{ width: size, height: size, fontSize: size * (muted ? 0.35 : 0.4) }}
    >
      {muted ? "🎵" : "💿"}
    </div>
  );
}
