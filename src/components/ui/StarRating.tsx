import { useState } from "react";
import styles from "./StarRating.module.css";

export default function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div className={styles.row}>
      {[...Array(10)].map((_, i) => {
        const v = i + 1;
        const filled = (hover ?? value) >= v;
        const cls = [
          styles.star,
          filled ? styles.filled : "",
          readonly ? styles.readonly : "",
        ].join(" ");
        return (
          <button
            key={v}
            onClick={() => !readonly && onChange?.(v)}
            onMouseEnter={() => !readonly && setHover(v)}
            onMouseLeave={() => !readonly && setHover(null)}
            className={cls}
          >
            ★
          </button>
        );
      })}
      {value > 0 && <span className={styles.value}>{value}/10</span>}
    </div>
  );
}
