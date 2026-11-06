import styles from "./RecordIcon.module.css";

export default function RecordIcon({
  count,
  onClick,
}: {
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      className={styles.button}
      onClick={onClick}
      title="Friends & Notifications"
    >
      <span className={styles.iconWrap}>
        <span className={styles.icon}>💿</span>
        {count > 0 && (
          <span className={styles.badge}>{count > 99 ? "99+" : count}</span>
        )}
      </span>
      <span className={styles.label}>Find bandmates</span>
    </button>
  );
}
