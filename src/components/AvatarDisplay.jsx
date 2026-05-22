export default function AvatarDisplay({ avatar, name, size = 34, onClick, muted = false }) {
  const isImage = avatar && (avatar.startsWith("http") || avatar.startsWith("data:"));
  const isEmoji = avatar && !isImage;

  return (
    <div onClick={onClick} style={{
      width: size, height: size, borderRadius: "50%", overflow: "hidden",
      background: muted ? "#1a1a2e" : "#1a1a3e", flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      cursor: onClick ? "pointer" : "default",
      border: onClick ? "1px solid #2a2a4e" : "none",
      boxSizing: "border-box",
    }}>
      {isImage ? (
        <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : isEmoji ? (
        <span style={{ fontSize: size * 0.48, lineHeight: 1 }}>{avatar}</span>
      ) : (
        <span style={{ fontSize: size * 0.42, color: muted ? "#555" : "#F4C542", fontWeight: 700 }}>
          {name?.[0]?.toUpperCase() || "?"}
        </span>
      )}
    </div>
  );
}
