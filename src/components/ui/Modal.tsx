import type { ReactNode } from "react";
import styles from "./Modal.module.css";

export default function Modal({
  title,
  onClose,
  variant = "dialog",
  width,
  headerGap,
  children,
}: {
  title: string;
  onClose: () => void;
  variant?: "dialog" | "drawer";
  width: number;
  headerGap: number;
  children: ReactNode;
}) {
  return (
    <>
      <div
        onClick={onClose}
        className={`${styles.backdrop} ${styles[`${variant}Backdrop`]}`}
      />
      <div className={`${styles.panel} ${styles[variant]}`} style={{ width }}>
        <div className={styles.header} style={{ marginBottom: headerGap }}>
          <span className={styles.title}>{title}</span>
          <button onClick={onClose} className={styles.close}>
            ×
          </button>
        </div>
        {children}
      </div>
    </>
  );
}
