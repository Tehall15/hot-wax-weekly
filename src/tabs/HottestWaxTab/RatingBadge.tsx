import styles from "./RatingBadge.module.css";

export default function RatingBadge({ value }: { value: number }) {
  return (
    <span className={styles.rating}>
      <span className={styles.star}>★</span>
      <span className={styles.value}>{value}</span>
      <span className={styles.outOf}>/10</span>
    </span>
  );
}
