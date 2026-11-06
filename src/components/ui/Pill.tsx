import type { ReactNode } from "react";
import styles from "./Pill.module.css";

export default function Pill({
  children,
  color,
}: {
  children?: ReactNode;
  color?: string;
}) {
  return (
    <span className={styles.pill} style={color ? { background: color } : undefined}>
      {children}
    </span>
  );
}
