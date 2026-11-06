import { Btn } from "../../components/ui";
import SlotCard from "../../components/album/SlotCard";
import type { SpotifyApi } from "../../hooks/useSpotify";
import type { Album, Slot, SlotField } from "../../types";
import shared from "../../styles/shared.module.css";
import styles from "./ReviewTab.module.css";
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
      <div className={`${shared.card} ${styles.weekCard}`}>
        <div>
          <div className={styles.weekLabel}>Week of</div>
          <div className={styles.weekDate}>
            {new Date(weekKey).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
            })}
          </div>
          <div className={styles.weekControls}>
            <button
              onClick={() => shiftWeek(-7)}
              className={styles.weekButton}
            >
              ← Previous
            </button>
            <button onClick={resetWeek} className={styles.weekButton}>
              Current
            </button>
          </div>
        </div>
        <div className={styles.completion}>
          <div className={styles.completionCount}>{completed}/3</div>
          <div className={styles.completionLabel}>ready</div>
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
        <div className={styles.submitButton}>
          <Btn onClick={submit} variant="primary">
            Save {completed} Review{completed !== 1 ? "s" : ""} →
          </Btn>
        </div>
      )}

      <PastReviewCard sp={sp} onSave={onSavePast} />
    </div>
  );
}
