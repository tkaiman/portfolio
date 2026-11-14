import React from 'react';
import { Link } from 'react-router-dom';

export type FluidMode = 'drop' | 'fan' | 'still';

export interface SharedBasinProps {
  fluidMode: FluidMode;
  setFluidMode: (mode: FluidMode) => void;
  viscosity: number;
  setViscosity: (v: number) => void;
  flowNormalized?: number;
  washiPlateSrc: string;
  swirlPlateSrc?: string;
  canvasSlot?: React.ReactNode;
  onDropPulse?: () => void;
}

const FAN_VANE_ANGLES = [0, 40, 80, 120, 160, 200, 240, 280, 320];

export const SuminagashiFanIcon: React.FC<{ active: boolean }> = ({ active }) => {
  const stroke = active ? '#f2f1ef' : '#3d424c';
  const fill = active ? 'rgba(242, 241, 239, 0.22)' : 'rgba(61, 66, 76, 0.16)';
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {FAN_VANE_ANGLES.map((deg) => (
        <path
          key={deg}
          d="M12 10.1 C13.5 8.5 14.7 5.8 13.1 3.3 C15.2 5.1 15.1 8.2 13.1 10.5 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth="0.95"
          strokeLinejoin="round"
          transform={`rotate(${deg} 12 12)`}
        />
      ))}
      <circle cx="12" cy="12" r="1.95" stroke={stroke} strokeWidth="1.05" />
    </svg>
  );
};

export const BasinFlowDial: React.FC<{
  flowNormalized: number;
  width?: number;
  height?: number;
}> = ({ flowNormalized, width, height }) => {
  const dialAngleRad = Math.max(0.06, Math.min(0.92, flowNormalized)) * Math.PI;
  const rimX = (23 + 21 * Math.sin(dialAngleRad)).toFixed(2);
  const rimY = (23 - 21 * Math.cos(dialAngleRad)).toFixed(2);
  const needleX = (23 + 16.8 * Math.sin(dialAngleRad)).toFixed(2);
  const needleY = (23 - 16.8 * Math.cos(dialAngleRad)).toFixed(2);
  const largeArc = dialAngleRad > Math.PI ? 1 : 0;

  return (
    <svg width={width} height={height} viewBox="0 0 46 46" fill="none" aria-hidden="true">
      <circle cx="23" cy="23" r="21" stroke="#a2a5aa" strokeWidth="1.05" />
      <path
        d="M23 2.4 A20.6 20.6 0 0 1 23 43.6"
        stroke="#787c84"
        strokeWidth="1.65"
        strokeDasharray="1.15 2.15"
      />
      <path
        d="M23 44 A21 21 0 0 1 5.4 34.2"
        stroke="#6a6e76"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <path
        d={`M23 23 L23 2 A21 21 0 ${largeArc} 1 ${rimX} ${rimY} Z`}
        fill="#1e2d4a"
        fillOpacity="0.085"
      />
      <line x1="23" y1="2" x2="23" y2="23" stroke="#7b7f87" strokeWidth="1.15" />
      <line
        x1="23"
        y1="23"
        x2={needleX}
        y2={needleY}
        stroke="#616670"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
};

const Landing: React.FC<SharedBasinProps> = ({
  fluidMode,
  setFluidMode,
  viscosity,
  setViscosity,
  flowNormalized = 0.31,
  washiPlateSrc,
  canvasSlot,
  onDropPulse,
}) => {
  const viscPct = `${Math.max(0, Math.min(100, ((viscosity - 0.05) / 0.32) * 100)).toFixed(1)}%`;

  const handleDropClick = () => {
    setFluidMode('drop');
    onDropPulse?.();
  };

  return (
    <div className="portfolio-surface">
      {/* First Viewport — Measured Spatial Contract on Desktop, Bespoke Vertical Flow on Mobile */}
      <section className="basin-viewport" aria-label="Introduction and interactive suminagashi basin">
        <div
          className="plate-washi-patch"
          style={{ backgroundImage: `url('${washiPlateSrc}')` }}
          aria-hidden="true"
        />

        {canvasSlot}

        {/* Desktop Rail Chrome */}
        <aside className="r-left-rail" aria-label="Left rail frame" />
        <span className="rail-divider rail-divider-1" aria-hidden="true" />
        <span className="rail-divider rail-divider-2" aria-hidden="true" />
        <span className="rail-divider rail-divider-3" aria-hidden="true" />
        <span className="rail-divider rail-divider-4" aria-hidden="true" />

        {/* 1. Brand & Primary Navigation */}
        <header className="m-topbar">
          <Link to="/" className="r-brand-mark">
            TAYLOR
            <span className="m-space"> </span><br className="desktop-br" />KAIMAN
          </Link>

          <nav className="m-nav-cluster" aria-label="Primary navigation">
            <Link to="/" className="rail-nav-item r-nav-overview" aria-current="page">
              <span className="nav-badge-active" aria-hidden="true">
                <svg viewBox="0 0 16 16" fill="none" stroke="#f2f1ef" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2.5 7.2L8 2.5l5.5 4.7" />
                  <path d="M4.2 6.2v6.8h7.6V6.2" />
                </svg>
              </span>
              <span>OVERVIEW</span>
            </Link>

            <Link to="/GameReviews" className="rail-nav-item r-nav-reviews">
              <span className="nav-icon-box" aria-hidden="true">
                <svg viewBox="0 0 16 16" fill="none" stroke="#474a4d" strokeWidth="1.3">
                  <rect x="2.2" y="2.2" width="11.6" height="11.6" rx="2" />
                </svg>
              </span>
              <span>GAME REVIEWS</span>
            </Link>

            <a
              href="https://github.com/tkaiman"
              target="_blank"
              rel="noreferrer"
              className="rail-nav-item r-nav-github"
            >
              <span className="nav-social-icon" aria-hidden="true">
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
              className="rail-nav-item r-nav-linkedin"
            >
              <span className="nav-social-icon" aria-hidden="true">
                <svg viewBox="0 0 16 16" fill="#0a1826">
                  <path d="M3.6 5.6H1.4V14h2.2V5.6ZM2.5 4.5a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6ZM14.4 14h-2.2V9.7c0-1.05-.38-1.76-1.32-1.76-.72 0-1.15.48-1.34.95-.07.17-.09.4-.09.64V14H7.25s.03-7.66 0-8.4h2.2v1.19c.3-.45.83-1.1 2.01-1.1 1.47 0 2.94.96 2.94 3.03V14Z" />
                </svg>
              </span>
              <span>LINKEDIN</span>
            </a>
          </nav>
        </header>

        {/* 2. Primary Basin Stage Copy & Actions */}
        <div className="m-hero-lead">
          <h1 className="r-hero-headline">
            Taylor Kaiman <span className="headline-emdash">—</span> Software
            <span className="m-space"> </span><br className="desktop-br" />Engineer at Google
          </h1>

          <p className="r-hero-subcopy">
            Architecting high-throughput data, AI migration, and
            <span className="m-space"> </span><br className="desktop-br" />global payments infrastructure across 175+ partners
          </p>

          <div className="m-cta-row">
            <a href="#engineering-record" className="r-cta-primary">
              VIEW ENGINEERING RECORD
            </a>

            <a
              href="https://www.linkedin.com/in/taylor-kaiman-4623921a7/"
              target="_blank"
              rel="noreferrer"
              className="r-cta-secondary"
            >
              Connect on LinkedIn
            </a>
          </div>
        </div>

        {/* 3. Four Engineering Dossier Cards */}
        <div className="m-cards-grid">
          <div className="m-card-unit">
            <article className="dossier-card r-card-1" aria-hidden="true" />
            <h2 className="dossier-card-title r-card-1-title">
              Core Platform
              <span className="m-space"> </span><br className="desktop-br" />—
            </h2>
            <p className="dossier-card-body r-card-1-body">
              175+ Global Partners
              <span className="m-space"> </span><br className="desktop-br" />&amp; AI Migrations
            </p>
          </div>

          <div className="m-card-unit">
            <article className="dossier-card r-card-2" aria-hidden="true" />
            <h2 className="dossier-card-title r-card-2-title">
              Payments
              <span className="m-space"> </span><br className="desktop-br" />Infrastructure —
            </h2>
            <p className="dossier-card-body r-card-2-body">
              Visa, Mastercard, Discover
              <span className="m-space"> </span><br className="desktop-br" />Tokenization &amp; FX
            </p>
          </div>

          <div className="m-card-unit">
            <article className="dossier-card r-card-3" aria-hidden="true" />
            <h2 className="dossier-card-title r-card-3-title">
              Automation &amp;
              <span className="m-space"> </span><br className="desktop-br" />AI —
            </h2>
            <p className="dossier-card-body r-card-3-body">
              Scaffolding &amp;
              <span className="m-space"> </span><br className="desktop-br" />Autonomous Triage
            </p>
          </div>

          <div className="m-card-unit">
            <article className="dossier-card r-card-4" aria-hidden="true" />
            <h2 className="dossier-card-title r-card-4-title">
              Earlier &amp;
              <span className="m-space"> </span><br className="desktop-br" />Education —
            </h2>
            <p className="dossier-card-body r-card-4-body">
              IDEXX (2020–2022) ·
              <span className="m-space"> </span><br className="desktop-br" />CU Boulder B.A. Chemistry
            </p>
          </div>
        </div>

        {/* 4. Live Fluid Controls & Basin Telemetry */}
        <div className="m-fluid-instrument">
          <div className="m-fluid-controls-group">
            <p className="r-fluid-heading">LIVE FLUID CONTROLS</p>

            <div className="m-fluid-buttons">
              <button
                type="button"
                className="fluid-mode-btn r-fluid-drop"
                onClick={handleDropClick}
                aria-pressed={fluidMode === 'drop'}
              >
                <span className={`fluid-circle ${fluidMode === 'drop' ? 'is-active' : ''}`} aria-hidden="true" />
                <span>DROP</span>
              </button>

              <button
                type="button"
                className="fluid-mode-btn r-fluid-fan"
                onClick={() => setFluidMode('fan')}
                aria-pressed={fluidMode === 'fan'}
              >
                <span className={`fluid-circle ${fluidMode === 'fan' ? 'is-active' : ''}`} aria-hidden="true">
                  <SuminagashiFanIcon active={fluidMode === 'fan'} />
                </span>
                <span>FAN</span>
              </button>

              <button
                type="button"
                className="fluid-mode-btn r-fluid-still"
                onClick={() => setFluidMode('still')}
                aria-pressed={fluidMode === 'still'}
              >
                <span className={`fluid-circle ${fluidMode === 'still' ? 'is-active' : ''}`} aria-hidden="true" />
                <span>STILL</span>
              </button>
            </div>

            <div className="m-viscosity-group">
              <label htmlFor="viscosity-input" className="r-fluid-viscosity-label">
                VISCOSITY {viscosity.toFixed(2)}
              </label>
              <div className="r-fluid-viscosity-slider">
                <input
                  id="viscosity-input"
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
            </div>
          </div>

          <aside className="r-right-rail" aria-label="Basin simulation telemetry" />
          <span className="telem-divider telem-divider-1" aria-hidden="true" />
          <span className="telem-divider telem-divider-2" aria-hidden="true" />

          <div className="m-telem-readouts">
            <div className="telem-block r-telem-res">
              <span className="telem-key">RESOLUTION</span>
              <span className="telem-val">2048²</span>
            </div>

            <div className="telem-block r-telem-visc">
              <span className="telem-key">VISCOSITY</span>
              <span className="telem-val">{viscosity.toFixed(2)}</span>
            </div>

            <div className="m-flow-dial-wrap">
              <p className="r-telem-flow-label">FLOW RATE</p>
              <div className="r-telem-flow-dial" aria-hidden="true">
                <BasinFlowDial flowNormalized={flowNormalized} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Below-the-Fold Architectural Engineering Record */}
      <div className="ledger-frame" id="engineering-record">
        <div className="ledger-rail-left" aria-hidden="true" />
        <div className="ledger-main">
          {/* Experience Ledger */}
          <section className="ledger-section" aria-labelledby="record-heading">
            <div className="ledger-section-header">
              <h2 id="record-heading" className="ledger-heading">
                Engineering Record
              </h2>
              <span className="ledger-span-years">2020 – Present</span>
            </div>

            <div className="ledger-role-block">
              <div className="ledger-role-meta">
                <h3 className="ledger-org">Google</h3>
                <p className="ledger-role-title">Software Engineer · Full-time</p>
                <p className="ledger-tenure">Jul 2022 – Present</p>
              </div>

              <div className="ledger-domains">
                <div className="ledger-domain-row">
                  <h4 className="ledger-domain-name">Core Platform</h4>
                  <p className="ledger-domain-copy">
                    Architecting high-throughput, secure data transfer and storage infrastructure,
                    while leading AI-driven legacy migrations across 175+ global financial and
                    telecom partners.
                  </p>
                </div>

                <div className="ledger-domain-row">
                  <h4 className="ledger-domain-name">Automation &amp; AI</h4>
                  <p className="ledger-domain-copy">
                    Engineered service-scaffolding tooling and autonomous AI workflows to accelerate
                    backend development and automate operational triage.
                  </p>
                </div>

                <div className="ledger-domain-row">
                  <h4 className="ledger-domain-name">Payments Infrastructure</h4>
                  <p className="ledger-domain-copy">
                    Led the zero-downtime launch of global network tokenization APIs (Visa,
                    Mastercard, Discover), modernized real-time FX pipelines, and scaled LatAm
                    payment integrations.
                  </p>
                </div>
              </div>
            </div>

            <div className="ledger-role-block">
              <div className="ledger-role-meta">
                <h3 className="ledger-org">IDEXX</h3>
                <p className="ledger-role-title">Software Engineer</p>
                <p className="ledger-tenure">2020 – 2022</p>
              </div>

              <div className="ledger-domains">
                <div className="ledger-domain-row">
                  <h4 className="ledger-domain-name">Database Reliability &amp; Verification</h4>
                  <p className="ledger-domain-copy">
                    Developed a full suite of automated tests for a database service handling
                    millions of entries a day.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Languages, Systems & Academic Foundation */}
          <section className="ledger-dual-section" aria-label="Technical stack and education">
            <div className="ledger-stack-col">
              <h2 className="ledger-heading">Technical Stack &amp; Focus</h2>
              <dl className="stack-spec-list">
                <div className="stack-spec-row">
                  <dt>Languages</dt>
                  <dd>Python · Java · TypeScript · JavaScript</dd>
                </div>
                <div className="stack-spec-row">
                  <dt>Frameworks &amp; DI</dt>
                  <dd>Guice · React</dd>
                </div>
                <div className="stack-spec-row">
                  <dt>Core Systems</dt>
                  <dd>
                    High-throughput data transfer &amp; storage · Global network tokenization &amp;
                    FX pipelines · Autonomous AI workflows &amp; service scaffolding · Automated
                    database testing
                  </dd>
                </div>
              </dl>
            </div>

            <div className="ledger-edu-col">
              <h2 className="ledger-heading">Education</h2>
              <div className="edu-entry">
                <h3 className="ledger-org">University of Colorado at Boulder</h3>
                <p className="edu-degree">Bachelor of Arts in Chemistry</p>
                <p className="ledger-tenure">2014 – 2018</p>
              </div>
            </div>
          </section>

          {/* Colophon Footer */}
          <footer className="ledger-footer">
            <span className="footer-sig">Taylor Kaiman · Software Engineer</span>
            <nav className="footer-links" aria-label="External profiles">
              <a href="https://github.com/tkaiman" target="_blank" rel="noreferrer">
                GitHub
              </a>
              <a
                href="https://www.linkedin.com/in/taylor-kaiman-4623921a7/"
                target="_blank"
                rel="noreferrer"
              >
                LinkedIn
              </a>
            </nav>
          </footer>
        </div>
        <div className="ledger-rail-right" aria-hidden="true" />
      </div>
    </div>
  );
};

export default Landing;
