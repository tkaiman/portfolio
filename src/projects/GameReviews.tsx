import React from 'react';
import { Link } from 'react-router-dom';
import ReviewList from './components/ReviewList.tsx';
import {
  BasinFlowDial,
  SuminagashiFanIcon,
  type SharedBasinProps,
} from './Landing.tsx';

const GameReviews: React.FC<SharedBasinProps> = ({
  fluidMode,
  setFluidMode,
  viscosity,
  setViscosity,
  flowNormalized = 0.31,
  washiPlateSrc,
  canvasSlot,
  onDropPulse,
}) => {
  const handleDropClick = () => {
    setFluidMode('drop');
    onDropPulse?.();
  };

  const viscPct = `${Math.max(0, Math.min(100, ((viscosity - 0.05) / 0.32) * 100)).toFixed(1)}%`;

  return (
    <div
      className="reviews-page-shell"
      style={{ backgroundImage: `url('${washiPlateSrc}')` }}
    >
      {/* Left Architectural Rail */}
      <aside className="subpage-rail-left" aria-label="Primary navigation and fluid controls">
        <div className="subpage-rail-top">
          <Link to="/" className="subpage-brand">
            TAYLOR
            <span className="m-space"> </span>
            <br className="desktop-br" />
            KAIMAN
          </Link>

          <hr className="subpage-rule" />

          <nav className="subpage-nav" aria-label="Site sections">
            <Link to="/" className="subpage-nav-link">
              <span className="subpage-icon-outline" aria-hidden="true">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2.5 7.2L8 2.5l5.5 4.7" />
                  <path d="M4.2 6.2v6.8h7.6V6.2" />
                </svg>
              </span>
              <span>OVERVIEW</span>
            </Link>

            <Link to="/GameReviews" className="subpage-nav-link is-active" aria-current="page">
              <span className="subpage-badge-active" aria-hidden="true">
                <svg viewBox="0 0 16 16" fill="none" stroke="#f2f1ef" strokeWidth="1.4">
                  <rect x="3" y="3" width="10" height="10" rx="1.8" />
                </svg>
              </span>
              <span>GAME REVIEWS</span>
            </Link>
          </nav>

          <hr className="subpage-rule" />

          <div className="subpage-nav">
            <a
              href="https://github.com/tkaiman"
              target="_blank"
              rel="noreferrer"
              className="subpage-nav-link"
            >
              <span className="subpage-icon-outline" aria-hidden="true">
                <svg viewBox="0 0 16 16" fill="#0e1726">
                  <path d="M8 0.8a7.2 7.2 0 0 0-2.28 14.03c.36.07.49-.15.49-.35v-1.23c-2 .43-2.42-.96-2.42-.96-.33-.83-.8-1.05-.8-1.05-.65-.45.05-.44.05-.44.72.05 1.1.74 1.1.74.64 1.1 1.68.78 2.09.6.06-.46.25-.78.45-.96-1.6-.18-3.28-.8-3.28-3.56 0-.79.28-1.43.74-1.94-.07-.18-.32-.91.07-1.9 0 0 .6-.19 1.98.74a6.85 6.85 0 0 1 3.6 0c1.38-.93 1.98-.74 1.98-.74.39.99.14 1.72.07 1.9.46.51.74 1.15.74 1.94 0 2.77-1.69 3.38-3.3 3.55.26.23.49.67.49 1.36v2.01c0 .2.13.42.5.35A7.2 7.2 0 0 0 8 0.8Z" />
                </svg>
              </span>
              <span>GITHUB</span>
            </a>
            <a
              href="https://www.linkedin.com/in/taylor-kaiman-4623921a7/"
              target="_blank"
              rel="noreferrer"
              className="subpage-nav-link"
            >
              <span className="subpage-icon-outline" aria-hidden="true">
                <svg viewBox="0 0 16 16" fill="#0a1826">
                  <path d="M3.6 5.6H1.4V14h2.2V5.6ZM2.5 4.5a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6ZM14.4 14h-2.2V9.7c0-1.05-.38-1.76-1.32-1.76-.72 0-1.15.48-1.34.95-.07.17-.09.4-.09.64V14H7.25s.03-7.66 0-8.4h2.2v1.19c.3-.45.83-1.1 2.01-1.1 1.47 0 2.94.96 2.94 3.03V14Z" />
                </svg>
              </span>
              <span>LINKEDIN</span>
            </a>
          </div>
        </div>

        <div className="subpage-rail-bottom">
          <hr className="subpage-rule" />
          <p className="subpage-fluid-label">LIVE FLUID CONTROLS</p>
          <div className="subpage-fluid-modes">
            <button
              type="button"
              className="subpage-fluid-btn"
              onClick={handleDropClick}
              aria-pressed={fluidMode === 'drop'}
            >
              <span className={`subpage-fluid-dot ${fluidMode === 'drop' ? 'is-active' : ''}`} />
              <span>DROP</span>
            </button>
            <button
              type="button"
              className="subpage-fluid-btn"
              onClick={() => setFluidMode('fan')}
              aria-pressed={fluidMode === 'fan'}
            >
              <span className={`subpage-fluid-dot ${fluidMode === 'fan' ? 'is-active' : ''}`}>
                <SuminagashiFanIcon active={fluidMode === 'fan'} />
              </span>
              <span>FAN</span>
            </button>
            <button
              type="button"
              className="subpage-fluid-btn"
              onClick={() => setFluidMode('still')}
              aria-pressed={fluidMode === 'still'}
            >
              <span className={`subpage-fluid-dot ${fluidMode === 'still' ? 'is-active' : ''}`} />
              <span>STILL</span>
            </button>
          </div>
          <hr className="subpage-rule" />
          <label htmlFor="reviews-visc-slider" className="subpage-fluid-label">
            VISCOSITY {viscosity.toFixed(2)}
          </label>
          <input
            id="reviews-visc-slider"
            className="viscosity-range"
            type="range"
            min="0.05"
            max="0.37"
            step="0.01"
            value={viscosity}
            style={{ '--visc-pct': viscPct } as React.CSSProperties}
            onChange={(e) => setViscosity(Number(e.target.value))}
          />
        </div>
      </aside>

      {/* Main Game Criticism Basin Stage */}
      <main className="reviews-stage">
        <div className="reviews-masthead">
          {canvasSlot}
          <header className="reviews-header">
            <h1 className="reviews-title">Game Reviews</h1>
            <p className="reviews-lead">
              Personal criticism and notes on RPG design, pacing, characterization, and music across
              favorite titles.
            </p>
          </header>
        </div>

        <div className="reviews-body-wrap">
          <ReviewList />
        </div>
      </main>

      {/* Right Telemetry Rail */}
      <aside className="subpage-rail-right" aria-label="Basin telemetry">
        <div className="subpage-telem-group">
          <div className="subpage-telem-item">
            <span className="telem-key">RESOLUTION</span>
            <span className="telem-val">2048²</span>
          </div>
          <div className="subpage-telem-item">
            <span className="telem-key">VISCOSITY</span>
            <span className="telem-val">{viscosity.toFixed(2)}</span>
          </div>
          <div className="subpage-telem-item">
            <span className="telem-key">FLOW RATE</span>
            <BasinFlowDial flowNormalized={flowNormalized} width={42} height={42} />
          </div>
        </div>
      </aside>
    </div>
  );
};

export default GameReviews;
