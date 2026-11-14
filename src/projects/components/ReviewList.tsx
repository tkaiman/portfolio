import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface ReviewItem {
  id: number;
  title: string;
  shortTitle?: string;
  content: string;
  rating: number;
  genres: string[];
}

type SortKey = 'rating' | 'title';

function ScoreSegments({ rating }: { rating: number }) {
  return (
    <span className="score-segments" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = Math.max(0, Math.min(1, rating - (n - 1)));
        return (
          <span key={n} className="score-seg-track">
            <span className="score-seg-fill" style={{ width: `${fill * 100}%` }} />
          </span>
        );
      })}
    </span>
  );
}

function ReviewList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>('rating');
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    const paramQ = searchParams.get('q') ?? '';
    setSearchTerm(paramQ);
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    fetch('/reviews.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<ReviewItem[]>;
      })
      .then((data) => {
        if (cancelled) return;
        setReviews(data);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [reloadNonce]);

  const allGenres = useMemo(() => {
    const set = new Set<string>();
    for (const r of reviews) {
      for (const g of r.genres) set.add(g.toLowerCase());
    }
    return Array.from(set);
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const list = reviews.filter((r) => {
      const genreOk =
        selectedGenres.length === 0 ||
        selectedGenres.some((g) => r.genres.map((x) => x.toLowerCase()).includes(g));
      if (!genreOk) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.content.toLowerCase().includes(q) ||
        r.genres.some((g) => g.toLowerCase().includes(q))
      );
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating || a.title.localeCompare(b.title);
      return a.title.localeCompare(b.title);
    });
  }, [reviews, searchTerm, selectedGenres, sortBy]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setSearchTerm(next);
    if (next.trim()) {
      setSearchParams({ q: next }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedGenres([]);
    setSearchParams({}, { replace: true });
  };

  const hasActiveFilter = searchTerm.trim().length > 0 || selectedGenres.length > 0;

  return (
    <div className="critique-index">
      <div className="critique-controls" role="region" aria-label="Filter and sort reviews">
        <div className="critique-search-row">
          <div className="critique-search-field">
            <svg
              className="critique-search-icon"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              aria-hidden="true"
            >
              <circle cx="7" cy="7" r="4.8" />
              <path d="M10.6 10.6L14 14" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              className="critique-search-input"
              aria-label="Filter reviews by title, genre, or commentary"
              placeholder="Filter by title, genre, or commentary…"
              value={searchTerm}
              onChange={handleQueryChange}
            />
            {hasActiveFilter && (
              <button type="button" className="critique-clear-inline" onClick={resetFilters}>
                Reset
              </button>
            )}
          </div>

          <div className="critique-sort-group" role="group" aria-label="Sort order">
            <button
              type="button"
              className={`critique-sort-btn ${sortBy === 'rating' ? 'is-selected' : ''}`}
              onClick={() => setSortBy('rating')}
              aria-pressed={sortBy === 'rating'}
            >
              Highest Rated
            </button>
            <button
              type="button"
              className={`critique-sort-btn ${sortBy === 'title' ? 'is-selected' : ''}`}
              onClick={() => setSortBy('title')}
              aria-pressed={sortBy === 'title'}
            >
              Title A–Z
            </button>
          </div>
        </div>

        <div className="critique-genre-row">
          <div className="critique-genre-pills" role="group" aria-label="Filter by genre">
            <button
              type="button"
              className={`genre-filter-pill ${selectedGenres.length === 0 ? 'is-selected' : ''}`}
              onClick={() => setSelectedGenres([])}
              aria-pressed={selectedGenres.length === 0}
            >
              All Genres
            </button>
            {allGenres.map((genre) => {
              const active = selectedGenres.includes(genre);
              return (
                <button
                  key={genre}
                  type="button"
                  className={`genre-filter-pill ${active ? 'is-selected' : ''}`}
                  onClick={() => toggleGenre(genre)}
                  aria-pressed={active}
                >
                  {genre.toUpperCase()}
                </button>
              );
            })}
          </div>
          <p className="critique-count" aria-live="polite">
            {status === 'ready' ? `${filteredReviews.length} of ${reviews.length} reviews` : 'Loading…'}
          </p>
        </div>
      </div>

      {status === 'loading' && (
        <div className="critique-state-box" role="status">
          <p className="critique-state-title">Reading review index…</p>
        </div>
      )}

      {status === 'error' && (
        <div className="critique-state-box" role="alert">
          <p className="critique-state-title">Could not load reviews.json from this origin.</p>
          <button
            type="button"
            className="critique-action-btn"
            onClick={() => setReloadNonce((n) => n + 1)}
          >
            Retry Loading Reviews
          </button>
        </div>
      )}

      {status === 'ready' && filteredReviews.length === 0 && (
        <div className="critique-state-box" role="status">
          <p className="critique-state-title">
            No reviews matched {searchTerm ? `“${searchTerm}”` : 'the selected genre filters'}.
          </p>
          <button type="button" className="critique-action-btn" onClick={resetFilters}>
            Show All {reviews.length} Reviews
          </button>
        </div>
      )}

      {status === 'ready' && filteredReviews.length > 0 && (
        <div className="critique-entries">
          {filteredReviews.map((review) => (
            <article key={review.id} className="critique-entry">
              <div className="critique-entry-meta">
                <div className="critique-rating-readout">
                  <span className="critique-score-num">{review.rating.toFixed(1)}</span>
                  <span className="critique-score-denom">/ 5.0</span>
                </div>
                <ScoreSegments rating={review.rating} />
                <ul className="critique-entry-genres" aria-label="Genres">
                  {review.genres.map((g) => (
                    <li key={g}>{g.toUpperCase()}</li>
                  ))}
                </ul>
              </div>
              <div className="critique-entry-body">
                <h2 className="critique-entry-title">{review.title}</h2>
                <p className="critique-entry-prose">{review.content}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReviewList;
