import type { Review } from "../../types";
import type { SpotifyApi } from "../../hooks/useSpotify";
import Top4Section from "./Top4Section";
import CoversGrid from "./CoversGrid";
import StatsSection from "./StatsSection";
import YearWrap from "./YearWrap";
import ReviewList from "./ReviewList";
import type { Top4Props } from "./shared";

function CollectionTab({
  reviews,
  top4All,
  top4Year,
  editTop4,
  setEditTop4,
  updateTop,
  swapTop,
  del,
  sp,
}: Top4Props & {
  reviews: Review[];
  del?: (id: string) => void;
  sp?: SpotifyApi;
}) {
  if (reviews.length === 0)
    return (
      <div className="mt-3 rounded-xl border bg-card p-10 text-center text-muted-foreground">
        <div className="mb-3 text-4xl">🎵</div>
        No reviews yet. Start with This Week!
      </div>
    );

  return (
    <div>
      <StatsSection reviews={reviews} />
      <Top4Section
        reviews={reviews}
        top4All={top4All}
        top4Year={top4Year}
        editTop4={editTop4}
        setEditTop4={setEditTop4}
        updateTop={updateTop}
        swapTop={swapTop}
        sp={sp}
      />
      <section className="mt-3 rounded-xl border bg-card p-4">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Collection ({reviews.length})
        </h2>
        <CoversGrid reviews={reviews} />
      </section>
      <YearWrap reviews={reviews} />
      <ReviewList reviews={reviews} del={del} />
    </div>
  );
}

export default CollectionTab;
