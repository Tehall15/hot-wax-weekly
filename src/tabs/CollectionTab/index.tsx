import type { Review } from "../../types";
import type { SpotifyApi } from "../../hooks/useSpotify";
import shared from "../../styles/shared.module.css";
import styles from "./index.module.css";
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
      <div
        className={[shared.card, styles.s1].join(" ")}
      >
        <div className={styles.s2}>🎵</div>
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
      <div className={[shared.card, styles.s3].join(" ")}>
        <div
          className={styles.s4}
        >
          Collection ({reviews.length})
        </div>
        <CoversGrid reviews={reviews} />
      </div>
      <YearWrap reviews={reviews} />
      <ReviewList reviews={reviews} del={del} />
    </div>
  );
}

export default CollectionTab;
