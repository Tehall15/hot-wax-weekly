import { useState } from "react";
import { AlbumArt, Btn } from "../../components/ui";
import { LOCAL_DB } from "../../utils/data";
import { NOW_YEAR } from "../../utils/time";
import type { SpotifyApi } from "../../hooks/useSpotify";
import type { Album, Review } from "../../types";
import shared from "../../styles/shared.module.css";
import styles from "./Top4Section.module.css";
import { resolveSlot, type Top4Props, type Which } from "./shared";

function Top4Section({
  reviews,
  top4All,
  top4Year,
  editTop4,
  setEditTop4,
  updateTop,
  swapTop,
  sp,
}: Top4Props & {
  reviews: Review[];
  sp?: SpotifyApi;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Album[]>([]);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const search = async (val: string) => {
    setQ(val);
    if (val.length < 2) {
      setResults([]);
      return;
    }
    let found: Album[] = [];
    if (sp?.searchAlbums) found = (await sp.searchAlbums(val)) || [];
    if (!found.length) {
      const low = val.toLowerCase();
      found = LOCAL_DB.filter(
        (a) =>
          a.artist.toLowerCase().includes(low) ||
          a.album.toLowerCase().includes(low),
      ).slice(0, 6);
    }
    setResults(found);
  };

  const clearSearch = () => {
    setQ("");
    setResults([]);
  };

  return (
    <>
      {(["all"] as Which[]).map((which) => {
        const data = which === "all" ? top4All : top4Year;
        const title = which === "all" ? "Top 4 All Time" : `Top 4 ${NOW_YEAR}`;
        const isEditing = editTop4 === which;

        return (
          <div
            key={which}
            className={[shared.card, styles.s1].join(" ")} style={{ marginTop: which === "year" ? 10 : 14 }}
          >
            <div
              className={styles.s2}
            >
              <span
                className={styles.s3}
              >
                {title}
              </span>
              <Btn
                onClick={() => {
                  setEditTop4(isEditing ? null : which);
                  clearSearch();
                }}
                variant="ghost"
                
              >
                {isEditing ? "Done" : "Edit"}
              </Btn>
            </div>

            {/* 4 small covers in a row */}
            <div
              className={styles.s5}
            >
              {data.map((item, i) => {
                const alb = resolveSlot(item, reviews);
                const isDragging = draggedIdx === i;
                const isDragOver = dragOverIdx === i && draggedIdx !== i;
                return (
                  <div
                    key={i}
                    draggable={!!alb}
                    onDragStart={() => {
                      setDraggedIdx(i);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverIdx(i);
                    }}
                    onDragLeave={() => setDragOverIdx(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedIdx !== null && draggedIdx !== i)
                        swapTop(which, draggedIdx, i);
                      setDraggedIdx(null);
                      setDragOverIdx(null);
                    }}
                    onDragEnd={() => {
                      setDraggedIdx(null);
                      setDragOverIdx(null);
                    }}
                    className={styles.s6} style={{ border: isDragOver
                        ? "2px solid #F4C542"
                        : isEditing
                          ? "2px dashed #3a3a5e"
                          : "1px solid #1e1e3e", opacity: isDragging ? 0.4 : 1, cursor: alb ? "grab" : "default" }}
                  >
                    <div className={styles.s7}>
                      {alb ? (
                        <>
                          {alb.image ? (
                            <img
                              src={alb.image}
                              alt={alb.album}
                              className={styles.s8}
                            />
                          ) : (
                            <div
                              className={styles.s9}
                            >
                              💿
                            </div>
                          )}
                          {/* number badge */}
                          <div
                            className={styles.s10}
                          >
                            {i + 1}
                          </div>
                          {/* clear button in edit mode */}
                          {isEditing && (
                            <button
                              onClick={() => updateTop(which, i, null)}
                              className={styles.s11}
                            >
                              ×
                            </button>
                          )}
                          {/* album name overlay */}
                          <div
                            className={styles.s12}
                          >
                            <div
                              className={styles.s13}
                            >
                              {alb.album}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div
                          className={styles.s14}
                        >
                          {isEditing ? "+" : ""}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Spotify search in edit mode */}
            {isEditing && (
              <div className={styles.s15}>
                <input
                  value={q}
                  onChange={(e) => search(e.target.value)}
                  placeholder={
                    sp?.token ? "Search any album on Spotify…" : "Search album…"
                  }
                  className={styles.s16}
                />
                {results.length > 0 && (
                  <div
                    className={styles.s17}
                  >
                    {results.map((r, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          const next = data.findIndex(
                            (x) => !resolveSlot(x, reviews),
                          );
                          const slot = next !== -1 ? next : 0;
                          updateTop(which, slot, {
                            artist: r.artist,
                            album: r.album,
                            image: r.image || null,
                            spotifyId: r.spotifyId || null,
                          });
                          clearSearch();
                        }}
                        className={styles.s18}
                        
                        
                      >
                        {r.image ? (
                          <img
                            src={r.image}
                            alt=""
                            className={styles.s19}
                          />
                        ) : (
                          <div
                            className={styles.s20}
                          >
                            💿
                          </div>
                        )}
                        <div className={styles.s21}>
                          <div
                            className={styles.s22}
                          >
                            {r.album}
                          </div>
                          <div className={styles.s23}>
                            {r.artist}
                            {r.year ? ` · ${r.year}` : ""}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

export default Top4Section;
