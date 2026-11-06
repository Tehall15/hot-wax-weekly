import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Props {
  avatar?: string | null;
  name?: string | null;
  size?: number;
  onClick?: () => void;
  muted?: boolean;
}

export default function AvatarDisplay({
  avatar,
  name,
  size = 34,
  onClick,
  muted = false,
}: Props) {
  const isImage =
    avatar && (avatar.startsWith("http") || avatar.startsWith("data:"));
  const isEmoji = avatar && !isImage;

  return (
    <Avatar
      onClick={onClick}
      className={cn(
        "overflow-hidden rounded-full after:border-transparent",
        muted ? "bg-muted" : "bg-secondary",
        onClick && "cursor-pointer after:border-border",
      )}
      style={{ width: size, height: size }}
    >
      {isImage && <AvatarImage src={avatar} alt="" />}
      <AvatarFallback
        className={cn(
          "font-bold",
          isEmoji
            ? "bg-transparent text-foreground"
            : muted
              ? "bg-muted text-muted-foreground"
              : "bg-secondary text-primary",
        )}
        style={{ fontSize: size * (isEmoji ? 0.48 : 0.42) }}
      >
        {isEmoji ? avatar : name?.[0]?.toUpperCase() || "?"}
      </AvatarFallback>
    </Avatar>
  );
}
