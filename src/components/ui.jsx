import { useState } from "react";

export function StarRating({ value, onChange, readonly = false }) {
  const [hover, setHover] = useState(null);
  return (
    <div style={{ display: "flex", gap: 1, alignItems: "center" }}>
      {[...Array(10)].map((_, i) => {
        const v = i + 1, filled = (hover ?? value) >= v;
        return (
          <button key={v} onClick={() => !readonly && onChange(v)}
            onMouseEnter={() => !readonly && setHover(v)}
            onMouseLeave={() => !readonly && setHover(null)}
            style={{ background: "none", border: "none", cursor: readonly ? "default" : "pointer",
              padding: 0, fontSize: 20, color: filled ? "#F4C542" : "#2a2a3e",
              transition: "all .1s", transform: filled && !readonly ? "scale(1.15)" : "scale(1)" }}>
            ★
          </button>
        );
      })}
      {value > 0 && <span style={{ marginLeft: 6, color: "#F4C542", fontWeight: 700, fontSize: 13 }}>{value}/10</span>}
    </div>
  );
}

export function AlbumArt({ src, size = 56 }) {
  return src
    ? <img src={src} alt="" style={{ width: size, height: size, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
    : <div style={{ width: size, height: size, borderRadius: 6, background: "#1a1a2e", display: "flex",
        alignItems: "center", justifyContent: "center", fontSize: size * 0.4, flexShrink: 0 }}>💿</div>;
}

export function Pill({ children, color = "#1e1e3a" }) {
  return <span style={{ display: "inline-block", background: color, borderRadius: 20, padding: "2px 9px",
    fontSize: 11, color: "#888", border: "1px solid #2a2a4a" }}>{children}</span>;
}

export function Btn({ children, onClick, variant = "default", style = {}, disabled = false }) {
  const variants = {
    primary: { background: "#F4C542", color: "#0d0d1a" },
    ghost:   { background: "transparent", color: "#aaa", border: "1px solid #333" },
    spotify: { background: "#1DB954", color: "#000" },
    default: { background: "#1e1e3a", color: "#ccc" },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding: "9px 18px", borderRadius: 8, border: "none", cursor: disabled ? "not-allowed" : "pointer",
        fontSize: 13, fontWeight: 600, transition: "all .18s", opacity: disabled ? 0.5 : 1,
        ...variants[variant], ...style }}>
      {children}
    </button>
  );
}
