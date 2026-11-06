import { useState } from "react";
import { cn } from "@/lib/utils";

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
    <div className="flex items-center gap-px">
      {[...Array(10)].map((_, i) => {
        const v = i + 1;
        const filled = (hover ?? value) >= v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => !readonly && onChange?.(v)}
            onMouseEnter={() => !readonly && setHover(v)}
            onMouseLeave={() => !readonly && setHover(null)}
            className={cn(
              "p-0 text-xl transition-all",
              filled ? "text-primary" : "text-muted-foreground/30",
              filled && !readonly && "scale-110",
              readonly ? "cursor-default" : "cursor-pointer",
            )}
          >
            ★
          </button>
        );
      })}
      {value > 0 && (
        <span className="ml-1.5 text-[13px] font-bold text-primary">{value}/10</span>
      )}
    </div>
  );
}
