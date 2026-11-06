import { cn } from "@/lib/utils";

export default function AlbumArt({
  src,
  size = 56,
  muted = false,
  className,
}: {
  src?: string | null;
  size?: number;
  muted?: boolean;
  className?: string;
}) {
  return src ? (
    <img
      src={src}
      alt=""
      className={cn("shrink-0 rounded-md object-cover", className)}
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md bg-muted",
        muted && "opacity-30",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * (muted ? 0.35 : 0.4) }}
    >
      {muted ? "🎵" : "💿"}
    </div>
  );
}
