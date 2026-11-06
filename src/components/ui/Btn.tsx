import type { CSSProperties, ReactNode } from "react";
import styles from "./Btn.module.css";

export default function Btn({
  children,
  onClick,
  variant = "default",
  style,
  disabled = false,
}: {
  children?: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "spotify" | "default";
  style?: CSSProperties;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${styles.btn} ${styles[variant]}`}
      style={style}
    >
      {children}
    </button>
  );
}
