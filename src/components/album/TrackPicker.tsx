import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Track } from "../../types";

export default function TrackPicker({
  tracks,
  selectedTracks,
  onChange,
}: {
  tracks: Track[];
  selectedTracks: string[];
  onChange: (tracks: string[]) => void;
}) {
  const [input, setInput] = useState("");

  const toggle = (name: string) => {
    if (selectedTracks.includes(name))
      onChange(selectedTracks.filter((t) => t !== name));
    else if (selectedTracks.length < 5) onChange([...selectedTracks, name]);
  };

  const add = () => {
    const t = input.trim();
    if (t && !selectedTracks.includes(t) && selectedTracks.length < 5) {
      onChange([...selectedTracks, t]);
      setInput("");
    }
  };

  return (
    <div>
      <div className="mb-2 text-[11px] tracking-[2px] text-muted-foreground uppercase">
        Top Tracks{" "}
        <span className="text-muted-foreground/70 normal-case italic tracking-normal">(up to 5)</span>
      </div>
      {tracks.length > 0 ? (
        <div className="flex max-h-[180px] flex-wrap gap-1.5 overflow-y-auto">
          {tracks.map((t) => {
            const sel = selectedTracks.includes(t.name);
            return (
              <Button
                key={t.num}
                type="button"
                onClick={() => toggle(t.name)}
                variant="outline"
                size="sm"
                className={cn(
                  "h-auto rounded-md border-border px-2.5 py-1 text-xs text-muted-foreground",
                  sel && "border-primary bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary",
                )}
              >
                {t.num}. {t.name} {sel && "★"}
              </Button>
            );
          })}
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Type track name…"
            className="h-auto flex-1 px-3 py-2 text-[13px]"
          />
          <Button onClick={add} variant="ghost" className="px-3.5 py-2">
            Add
          </Button>
        </div>
      )}
      {selectedTracks.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selectedTracks.map((t) => (
            <span key={t} className="flex items-center gap-1.5 rounded-4xl border border-primary bg-primary/10 px-2.5 py-0.75 text-xs text-primary">
              ★ {t}
              <Button
                type="button"
                onClick={() => onChange(selectedTracks.filter((x) => x !== t))}
                variant="ghost"
                size="icon-xs"
                aria-label={`Remove ${t}`}
                className="size-4 rounded-full p-0 text-muted-foreground hover:text-foreground"
              >
                ×
              </Button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
