import { Button } from "@/components/ui/button";
import SlotCard from "../../components/album/SlotCard";
import type { SpotifyApi } from "../../hooks/useSpotify";
import type { Album, Slot, SlotField } from "../../types";
import PastReviewCard, { type PastSaveFn } from "./PastReviewCard";

export default function ReviewTab({
  slots,
  weekKey,
  shiftWeek,
  resetWeek,
  updateSlot,
  rollRS,
  sp,
  completed,
  submit,
  onSavePast,
}: {
  slots: Slot[];
  weekKey: string;
  shiftWeek: (days: number) => void;
  resetWeek: () => void;
  updateSlot: (
    id: string,
    field: SlotField,
    value: Album | number | string | string[] | null,
  ) => void;
  rollRS: () => void;
  sp: SpotifyApi;
  completed: number;
  submit: () => void;
  onSavePast: PastSaveFn;
}) {
  return (
    <div>
      <div className="mt-4 flex justify-between rounded-xl border border-border bg-card p-4">
        <div>
          <div className="text-xs text-muted-foreground">Week of</div>
          <div className="text-[15px] font-bold">
            {new Date(weekKey).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
            })}
          </div>
          <div className="mt-2 flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => shiftWeek(-7)}
            >
              ← Previous
            </Button>
            <Button variant="outline" size="sm" onClick={resetWeek}>
              Current
            </Button>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[26px] font-bold text-primary">{completed}/3</div>
          <div className="text-[11px] text-muted-foreground">ready</div>
        </div>
      </div>

      <SlotCard
        slot={slots[0]}
        label="Contemporary 1"
        badge="New"
        color="#4ECDC4"
        updateSlot={(f, v) => updateSlot("c1", f, v)}
        getTracklist={sp.getTracklist}
        searchFn={sp.token ? sp.searchAlbums : undefined}
      />
      <SlotCard
        slot={slots[1]}
        label="Contemporary 2"
        badge="New"
        color="#45B7D1"
        updateSlot={(f, v) => updateSlot("c2", f, v)}
        getTracklist={sp.getTracklist}
        searchFn={sp.token ? sp.searchAlbums : undefined}
      />
      <SlotCard
        slot={slots[2]}
        label="Classic Pick"
        badge="Classic"
        color="#F4C542"
        updateSlot={(f, v) => updateSlot("rs", f, v)}
        rollRS={rollRS}
        getTracklist={sp.getTracklist}
        searchFn={sp.token ? sp.searchAlbums : undefined}
      />

      {completed > 0 && (
        <div className="w-full">
          <Button onClick={submit} className="mt-5 w-full p-3.5 text-[15px]">
            Save {completed} Review{completed !== 1 ? "s" : ""} →
          </Button>
        </div>
      )}

      <PastReviewCard sp={sp} onSave={onSavePast} />
    </div>
  );
}
