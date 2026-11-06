import type { Review } from "../../types";

function CoversGrid({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;
  return (
    <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-3">
      {[...reviews].reverse().map((r) => (
        <div
          key={r.id}
          className="relative aspect-square overflow-hidden rounded-lg bg-muted"
        >
          {r.image ? (
            <img
              src={r.image}
              alt={r.album}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-3xl">
              💿
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-1.5 pb-1.5 pt-5 text-[10px] font-semibold leading-tight text-white">
            <div className="truncate">{r.album}</div>
            <div className="mt-0.5 text-primary">{r.rating}/10</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default CoversGrid;
