import SlotCard from "../components/SlotCard";
import { Btn } from "../components/ui";

const card = { background: "#111122", border: "1px solid #1e1e3e", borderRadius: 12, padding: 18, marginTop: 14 };

export default function ReviewTab({ slots, weekKey, shiftWeek, resetWeek, updateSlot, rollRS, sp, completed, submit }) {
  return (
    <div>
      <div style={{ ...card, background: "#0e0e20", display: "flex", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 12, color: "#555" }}>Week of</div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>
            {new Date(weekKey).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <button onClick={() => shiftWeek(-7)}
              style={{ background: "#1a1a2e", border: "1px solid #2a2a4e", color: "#888",
                borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 11 }}>
              ← Previous
            </button>
            <button onClick={resetWeek}
              style={{ background: "#1a1a2e", border: "1px solid #2a2a4e", color: "#888",
                borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 11 }}>
              Current
            </button>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#F4C542" }}>{completed}/3</div>
          <div style={{ fontSize: 11, color: "#555" }}>ready</div>
        </div>
      </div>

      <SlotCard slot={slots[0]} label="Contemporary 1" badge="New" color="#4ECDC4"
        updateSlot={(f, v) => updateSlot("c1", f, v)}
        getTracklist={sp.getTracklist} searchFn={sp.token ? sp.searchAlbums : null} />
      <SlotCard slot={slots[1]} label="Contemporary 2" badge="New" color="#45B7D1"
        updateSlot={(f, v) => updateSlot("c2", f, v)}
        getTracklist={sp.getTracklist} searchFn={sp.token ? sp.searchAlbums : null} />
      <SlotCard slot={slots[2]} label="Classic Pick" badge="Classic" color="#F4C542"
        updateSlot={(f, v) => updateSlot("rs", f, v)} rollRS={rollRS}
        getTracklist={sp.getTracklist} searchFn={sp.token ? sp.searchAlbums : null} />

      {completed > 0 && (
        <Btn onClick={submit} variant="primary"
          style={{ width: "100%", marginTop: 20, padding: 14, fontSize: 15 }}>
          Save {completed} Review{completed !== 1 ? "s" : ""} →
        </Btn>
      )}
    </div>
  );
}
