---
name: Taylor Kaiman Portfolio
description: "A chemistry-trained systems engineer's living suminagashi ink basin uniting planet-scale infrastructure dossiers with candid RPG criticism."
world: "medium-native-fluid-ink-basin"
colors:
  indigo-depth: "#081730"
  ink-current: "#1e2d4a"
  washi-ground: "#f2f1ef"
  washi-elevated: "rgba(242, 241, 239, 0.92)"
  washi-on-indigo: "#f0f1ee"
  mist-tint: "#dde2e8"
  hairline-rule: "#c4c5c0"
  card-rule: "#b8b9b5"
  feathered-slate: "#8991a1"
  dilute-ink: "#515661"
  ink-secondary: "#373c46"
  sumi-ink: "#0c0f17"
typography:
  display:
    fontFamily: "'Noto Sans HK', 'IBM Plex Sans Condensed', sans-serif"
    fontSize: "2.75rem"
    fontWeight: 400
    lineHeight: 1.19
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "'Noto Sans HK', 'IBM Plex Sans Condensed', sans-serif"
    fontSize: "2.15rem"
    fontWeight: 400
    lineHeight: 1.18
    letterSpacing: "-0.01em"
  title:
    fontFamily: "'IBM Plex Sans Condensed', 'Fira Sans Condensed', sans-serif"
    fontSize: "1.8rem"
    fontWeight: 500
    lineHeight: 1.18
    letterSpacing: "-0.005em"
  body:
    fontFamily: "'Fira Sans Condensed', 'IBM Plex Sans Condensed', sans-serif"
    fontSize: "1.14rem"
    fontWeight: 400
    lineHeight: 1.58
    letterSpacing: "0em"
  label:
    fontFamily: "'IBM Plex Sans Condensed', 'Fira Sans Condensed', sans-serif"
    fontSize: "0.78rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.05em"
  mono-readout:
    fontFamily: "'IBM Plex Mono', monospace"
    fontSize: "0.85rem"
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: "0em"
    fontFeature: "'tnum' 1"
rounded:
  xs: "1px"
  sm: "5px"
  md: "6px"
  lg: "7px"
  full: "9999px"
spacing:
  xs: "0.35rem"
  sm: "0.65rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2.5rem"
  stage: "4.5rem"
components:
  button-primary:
    backgroundColor: "{colors.indigo-depth}"
    textColor: "{colors.washi-on-indigo}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "0 1.25rem"
    height: "44px"
  button-primary-hover:
    backgroundColor: "#12264a"
    textColor: "{colors.washi-on-indigo}"
  chip-genre:
    backgroundColor: "{colors.washi-elevated}"
    textColor: "{colors.ink-secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0.36rem 0.72rem"
  chip-genre-selected:
    backgroundColor: "{colors.indigo-depth}"
    textColor: "{colors.washi-on-indigo}"
    rounded: "{rounded.sm}"
    padding: "0.36rem 0.72rem"
  input-search:
    backgroundColor: "{colors.washi-elevated}"
    textColor: "{colors.sumi-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 0.75rem"
    height: "42px"
  card-dossier:
    backgroundColor: "{colors.washi-elevated}"
    textColor: "{colors.sumi-ink}"
    rounded: "{rounded.md}"
    padding: "1.05rem 1.15rem"
---

# Design System: Taylor Kaiman Portfolio

## Overview

**Creative North Star: "The Living Suminagashi Basin"**

Built from the `medium-native-fluid-ink-basin` visual world (`seed:aad54a91f66a04d6`), Taylor Kaiman's portfolio (`taylorkaiman.dev`) frames a chemistry-trained Google software engineer's infrastructure record and personal RPG criticism inside a tactile water-marbling workshop. Rather than defaulting to dark-neon developer terminals or sterile SaaS Bento grids, the system grounds every view on warm unbleached kozo washi paper, ruled by continuous `1px` architectural plumb lines and animated by concentric sumi-indigo rings floating across a physical water basin.

Density balances gallery-grade quietude with laboratory precision. A three-column architectural frame—persistent left navigation and physical fluid controls (`DROP`, `FAN`, `STILL`, `VISCOSITY`), an expansive central reading and marbling stage, and a narrow right simulation telemetry margin (`RESOLUTION`, `VISCOSITY`, `FLOW RATE`)—unites planet-scale backend dossiers (175+ global partners, network tokenization, AI triage, IDEXX, CU Boulder Chemistry) with searchable, genre-filterable game reviews (`/GameReviews`).

Motion and browser chrome belong to the basin's physics. Interactive controls settle along an exponential ease-out curve (`240ms`–`260ms cubic-bezier(0.16, 1, 0.3, 1)`), while pointer dragging, gliding, and fluid verbs (`DROP`, `FAN`, `STILL`, `VISCOSITY`) carry vector suminagashi ink in real time on a Canvas2D `<canvas>` (`FluidBasinCanvas.tsx`), with no raster plate behind it. Under `prefers-reduced-motion: reduce`, all CSS transitions halt and the basin shows its finished, physics-generated composition at once and holds still. Native browser surfaces are themed to match: text selection carries a dilute indigo wash (`rgba(30, 45, 74, 0.18)` over `#081730`, with `user-select: none` on the interactive basin stage so clicking or dragging never darkens the marbled surface), text carets and `:focus-visible` outlines (`2px solid #1e2d4a`, `2px` offset) track the active ink current, and scrollbars render as thin `8px` feathered-slate thumbs (`#8991a1`) inset against the washi ground.

**Key Characteristics:**
- **Tactile Washi & Sumi Materiality:** Seamless kozo fiber paper (`#f2f1ef`) paired with carbon sumi ink (`#0c0f17`) and single-pigment deep indigo (`#081730` / `#1e2d4a`).
- **Three-Column Architectural Plumb Frame:** Left control rail (`10.470%` / `152px`), central basin and ledger stage (`81.830%` / `1fr`), and right simulation telemetry rail (`7.700%` / `112px`).
- **Four Self-Hosted Typographic Voices:** Airy geometric-humanist display (`Noto Sans HK`), condensed structural headers and tracked controls (`IBM Plex Sans Condensed`), readable condensed editorial prose (`Fira Sans Condensed`), and tabular telemetry readouts (`IBM Plex Mono`).
- **Vector Suminagashi Ink on a Live Water Field:** Every drop is a closed polygon carried by an incompressible CPU fluid solver. Ink is never resampled into pixels, so marbled lines stay razor-sharp however long the water is stirred. Drops bloom by Jaffer's exact area-preserving displacement. Everything is coupled to `DROP`, `FAN`, `STILL`, and `VISCOSITY` (`0.05`–`0.37`).
- **Physics-Generated Opening:** There is no starting image. Each visit seeds a new composition: concentric rings bloom at 2–4 sites, stray specks land, then sweeping strokes stir it into marbling, all in about 3–4 seconds.
- **Feathered Masking:** The washi plate and the ink canvas feather into the paper ground via directional linear-gradient alpha masks and a copy-zone veil, so marbled ink never compromises text contrast.
- **Flat-At-Rest Paper Discipline:** Surfaces sit flush with `1px` mineral rules at rest, reserving soft indigo-tinted shadows exclusively for hover states.

## Colors

A disciplined single-pigment palette of deep sumi indigo and carbon black suspended across warm unbleached kozo washi paper (resolving the initial direction brief's cooler `#F6F7F9` paper study into warmer tactile `#f2f1ef` fiber and deeper `#081730` indigo in the shipped build).

### Primary
- **Deep Sumi Indigo** (`#081730`): Primary high-authority accent (`15.8:1` WCAG AAA contrast against `#f2f1ef`). Used for the primary CTA fill (enriched with `radial-gradient(125% 150% at 78% 20%, #132a52 0%, #071730 60%, #051126 100%)` and `#12264a` hover), selected sort segments and active genre filter pills, active circular fluid-mode indicators and slider thumbs (`#081835`), active navigation badges (`#09162f`), and `/GameReviews` numeric scores and 5-segment rating fills.
- **Living Indigo Current** (`#1e2d4a`): Interactive mid-indigo pigment (`12.2:1` AAA on `#f2f1ef`). Used for link and review-entry hover states, `:focus-visible` `2px` outlines, input focus-within borders, `caret-color`, inline filter reset actions, `::selection` wash (`rgba(30, 45, 74, 0.18)`), flow-dial sector fill (`8.5%` opacity), and concentric canvas ring interiors.

### Neutral
- **Unbleached Kozo Washi** (`#f2f1ef`): Root canvas ground across `html`, `body`, `.basin-viewport`, `.portfolio-surface`, `.reviews-page-shell`, and custom scrollbar tracks.
- **Lifted Washi Veil** (`rgba(242, 241, 239, 0.92)`): Translucent paper layer floated over marbled plates to preserve text contrast while letting faint fiber and ink warmth breathe beneath—applied at `0.92` on segmented controls, genre pills, and mobile bars, `0.95` on dossier cards, search fields, and state boxes, and `0.90` on sticky subpage rails.
- **Washi Reserve on Indigo** (`#f0f1ee`): Crisp warm-white foreground (`15.7:1` AAA on `#081730`) for text and icons inside primary indigo buttons (`#e8ecee` on hero CTA), selected sort toggles, and selected genre pills.
- **Basin Water Mist** (`#dde2e8`): Cool mineral water tint reserved for subtle atmospheric highlights in the basin palette.
- **Architectural Hairline Rule** (`#c4c5c0`): Primary `1px` horizontal section, masthead, and ledger dividers, paired with `#c6c6c4` on full-height vertical rail borders, `#b9b9ba` on major band boundaries, and `#d3d3cd` / `#d4d5cf` / `#dcddd7` for fine internal rail and row subdivisions.
- **Dossier Card Rule** (`#b8b9b5`): Structural `1px` perimeter border on engineering dossier cards, segmented sort groups, genre filter pills, and empty/error state boxes (tightening to `#a8aab0` on search inputs and darkening to `#8f939d` on card hover).
- **Feathered Sumi Slate** (`#8991a1`): Non-text instrument and chrome tone used for custom scrollbar thumbs, flow-dial reference arcs (`#787c84`–`#a2a5aa`), inactive circular control borders (`#adb0b5`), and even-numbered concentric canvas rings (`rgba(96, 109, 128, alpha)`).
- **Dilute Sumi Wash** (`#515661`): Muted metadata and caption ink (`6.5:1` AA on `#f2f1ef`). Used for search input placeholders (`#535865`, `6.3:1` AA), telemetry keys (`#4a4e55`), role tenures, live review counts (`#414652`), and rating denominators (`#464b57`).
- **Secondary Iron-Slate Ink** (`#373c46`): Supporting UI and editorial ink (`9.8:1` AAA on `#f2f1ef`). Used for inactive rail navigation links (`#252830`–`#36393f`), fluid control headings (`#35383e`), unselected filter pills, stack `dt` labels (`#3f444f`), and footer signatures (`#3c414c`).
- **Carbon Sumi Ink** (`#0c0f17`): Primary typographic ink (`17.0:1` AAA on `#f2f1ef`). Used for display headlines (`#0a0f1e`), brand marks (`#0c0d10`), organization and review titles (`#0c0f17`), dossier card titles (`#0e1014`), and long-form engineering and review prose (`#0e1015`–`#191d25`).

### Named Rules
**The Single-Pigment Basin Rule.** Deep sumi indigo (`#081730` / `#1e2d4a`) is the sole chromatic pigment in the system. Never introduce secondary teal, emerald, amber, or semantic rainbow accents; hierarchy comes from ink concentration, hairline rules, and indigo fill density. **Basin exception:** the pigment inside the fluid basin is the traditional suminagashi trio. That means sumi black and indigo separated by clear-water rings, plus a rare beni red (`#b5372b`, at most one ring per opening and ~7% of visitor drops). Beni never appears in UI chrome.

**The Ink-Tinted Secondary Rule.** Every muted text, placeholder, caption, and instrument stroke carries a cool iron-indigo undertone (`#373c46`, `#515661`, `#8991a1`)—never pure neutral `#808080` gray—and all readable copy including input placeholders must hold at least `4.5:1` contrast against `#f2f1ef` (shipped minimum: `6.3:1`).

**The Translucent Washi Veil Rule.** Containers overlapping the suminagashi basin use high-opacity warm paper veils (`rgba(242, 241, 239, 0.90)`–`0.95`) rather than pure `#ffffff` boxes or frosted `backdrop-filter: blur()` glass, keeping surfaces materially unified with the kozo sheet.

## Typography

**Display Font:** `'Noto Sans HK'` (with `'IBM Plex Sans Condensed', sans-serif` fallback)
**Body Font:** `'Fira Sans Condensed'` (with `'IBM Plex Sans Condensed', sans-serif` fallback)
**Label/Mono Font:** `'IBM Plex Sans Condensed'` for structural titles and uppercase UI controls; `'IBM Plex Mono'` for quantitative telemetry, tenures, and rating readouts

**Character:** Four self-hosted `.woff2` voices loaded with `font-display: block` pair calm, open-counter East Asian geometric-humanist display lettering (`Noto Sans HK`) with crisp architectural condensed sans-serifs (`IBM Plex Sans Condensed` and `Fira Sans Condensed`) and precision instrument monospace (`IBM Plex Mono`). Display headlines use inline condensed em-dashes (`.headline-emdash` scaled via `transform: scaleX(0.84)`) so punctuation stays taut rather than sprawling.

### Hierarchy
- **Display** (`400`, `2.75rem` / `calc(44 * var(--u))` on home stage, `clamp(2.1rem, 3.1vw, 2.75rem)` on `/GameReviews`, `clamp(1.85rem, 6.8vw, 2.5rem)` on mobile, `line-height: 1.16`–`1.19`, `letter-spacing: -0.01em`): Primary page `<h1>` headlines (`Taylor Kaiman — Software Engineer at Google`, `Game Reviews`), plus uppercase tracked brand marks (`calc(23.6 * var(--u))` / `1.35rem`, `letter-spacing: 0.05em`–`0.08em`).
- **Headline** (`400`, `clamp(1.65rem, 2.3vw, 2.15rem)`, `line-height: 1.18`, `letter-spacing: -0.01em`, `text-wrap: balance`): Major architectural ledger `<h2>` headings (`Engineering Record`, `Technical Stack & Focus`, `Education`).
- **Title** (`400`–`500`, `calc(29.5 * var(--u))` on desktop dossier cards, `1.5rem` on ledger organizations, `clamp(1.45rem, 2.1vw, 1.8rem)` on review entry titles, `1.25rem` on engineering domain headings, `line-height: 1.10`–`1.20`): Structural card, employer, domain, and critique titles in `IBM Plex Sans Condensed`.
- **Body** (`400`, `1.12rem`–`1.14rem` in ledgers and reviews, `1.25rem` on subpage lead, `calc(22.4 * var(--u))` on hero subcopy, `calc(19.6 * var(--u))` on desktop dossier cards, `line-height: 1.48`–`1.58` for prose and `1.28`–`1.35` for stage summaries): Long-form engineering descriptions (`68ch` max measure), technical stack specs (`60ch` max measure), and RPG criticism (`66ch` max measure) set in `Fira Sans Condensed`.
- **Label** (`500`–`600`, `0.70rem`–`0.90rem` / `calc(10.2 * var(--u))`–`calc(15.5 * var(--u))`, `letter-spacing: 0.04em`–`0.06em`, uppercase): Rail navigation items, fluid control verbs (`DROP`, `FAN`, `STILL`), `VISCOSITY` labels, right-rail telemetry keys, sort toggles, genre filter pills, primary button labels, and technical stack `dt` keys.
- **Mono Readout** (`400`–`500`, `0.80rem`–`0.85rem` for spans/tenures/counts and `1.55rem` weight `500` for review rating numerators, `line-height: 1.35`, `font-variant-numeric: tabular-nums`): Year ranges (`2020 – Present`), role tenures (`Jul 2022 – Present`), live filtered review counts (`3 of 3 reviews`), and `/ 5.0` rating readouts in `IBM Plex Mono`.

### Named Rules
**The Tabular Instrument Rule.** Every numeric readout—live `VISCOSITY` values, `RESOLUTION VECTOR`, review index scores (`5.0/5`), filtered result counts, tenure dates, and rating numerators—must set `font-variant-numeric: tabular-nums` so slider scrubbing and state updates never shift layout width.

**The Self-Hosted Block-Render Rule.** All typefaces load exclusively from self-hosted `/fonts/*.woff2` assets with `font-display: block`. Never load external font CDNs or fall back to platform system display faces that would cause FOUT reflows inside measured stage coordinates.

**The Calm Weight Ceiling Rule.** Display and headline voices stay at weight `400` (`Noto Sans HK`); structural titles peak at `500` and compact uppercase labels peak at `600` (`IBM Plex Sans Condensed`). Weight `700` bold display headers are never used.

## Layout

The spatial architecture is governed by a continuous three-column plumb frame that adapts cleanly across three structural regimes without losing its architectural rails:

1. **First-Viewport Basin Stage (`.basin-viewport` on `/`):** Locked to a `1376 / 768` desktop aspect ratio with `container-type: inline-size` and a proportional container-query unit `--u: calc(100cqw / 1376)`. Every desktop coordinate (`--r-*`), type size (`calc(N * var(--u))`), icon box, and border radius scales linearly with viewport width across three vertical zones:
   - **Left Architectural Rail (`0%`–`10.470%` width):** Full-height `1px solid #c6c6c4` right border subdivided by four horizontal `#d3d3cd` hairlines (`17.71%`, `37.89%`, `68.36%`, `89.32%`), housing the stacked `TAYLOR KAIMAN` mark, `OVERVIEW` / `GAME REVIEWS` navigation, `GITHUB` / `LINKEDIN` profile links, and live fluid controls (`DROP`, `FAN`, `STILL`, `VISCOSITY` range slider).
   - **Central Basin Stage (`10.470%`–`92.300%`, `81.830%` width):** Dedicated exclusively to Taylor's engineering overview (Game Reviews is linked solely via the left-rail `GAME REVIEWS` item and never referenced on `/`). Features the calm left editorial zone (`x: 15.630%`) holding the `<h1>` headline (`y: 17.500%`), infrastructure subcopy (`y: 33.400%`), primary `VIEW ENGINEERING RECORD` CTA, and `Connect on LinkedIn` secondary link (`y: 44.500%`); full-height marbled ink field (`x: 46.150%`, `w: 46.150%`, `h: 100.000%`) advected across the entire basin stage; and four equal dossier cards anchored at `y: 68.800%` (`w: 17.950%`–`18.100%`, `h: 20.440%`).
   - **Right Telemetry Rail (`92.300%`–`100%`, `7.700%` width):** Full-height `1px solid #c6c6c4` left border anchored near the lower margin (`y: 66.800%`–`88.670%`) with `RESOLUTION`, `VISCOSITY`, and the SVG `FLOW RATE` dial.

2. **Below-the-Fold Engineering Ledger (`.ledger-frame` on `/`):** A fluid CSS Grid (`grid-template-columns: 10.470% 81.830% 7.700%`) that extends the exact left and right rail plumb lines down the full page height. Inside `.ledger-main` (`padding: clamp(3rem, 5vw, 5rem) clamp(2rem, 5.2vw, 4.5rem) clamp(2.5rem, 4vw, 3.5rem)`), employer role blocks use a two-column split (`grid-template-columns: minmax(180px, 26%) 1fr`, `gap: clamp(1.5rem, 3.5vw, 3rem)`), followed by a `1.35fr 1fr` dual section for `Technical Stack & Focus` (`140px 1fr` specification rows) and `Education`, closing with a horizontal colophon footer (`GITHUB`, `LINKEDIN`).

3. **Subpage Critique Shell (`.reviews-page-shell` on `/GameReviews`):** Uses fixed-pixel outer rails (`grid-template-columns: 152px 1fr 112px`) with `position: sticky; top: 0; height: 100vh` on `.subpage-rail-left` and `.subpage-rail-right` so navigation, fluid controls, and live telemetry remain accessible while scrolling long-form reviews. `.reviews-stage` separates an overflow-hidden `.reviews-masthead` (`border-bottom: 1px solid #c4c5c0`) from `.reviews-body-wrap`, where each `.critique-entry` sits on a `185px 1fr` metadata-to-prose grid.

**Responsive Breakpoints & Reflow:**
- **Desktop (`> 960px`):** Semantic mobile grouping wrappers (`.m-topbar`, `.m-nav-cluster`, `.m-hero-lead`, `.m-cards-grid`, `.m-card-unit`, `.m-fluid-instrument`) declare `display: contents`, dissolving out of the layout tree so child nodes position directly against `.basin-viewport` (with `.m-cta-row` arranged as an inline flex action bar at `y: 44.500%`).
- **Tablet & Mobile (`@media (max-width: 960px)`):** `.basin-viewport` switches to `aspect-ratio: auto; container-type: normal; display: flex; flex-direction: column`. Desktop absolute rail chrome hides, and the semantic wrappers materialize in reading order: (1) `.m-topbar` header with horizontal wrapping nav (`min-height: 36px` touch targets), (2) `.m-hero-lead` copy and CTA row (`44px` primary button height), (3) 2-column `.m-cards-grid` (`repeat(2, minmax(0, 1fr))`), and (4) unified `.m-fluid-instrument` card combining `DROP`/`FAN`/`STILL`, viscosity slider, and live telemetry readouts. Below-the-fold `.ledger-role-block`, `.ledger-dual-section`, `.stack-spec-row`, and `/GameReviews` `.critique-entry` grids all collapse cleanly to `1fr`, while `.reviews-page-shell` converts its left rail into a static top header bar.
- **Narrow Mobile (`@media (max-width: 600px)`):** `.m-cards-grid` collapses from 2 columns to a single `1fr` column so dossier titles and summaries never orphan or clip down to `320px` width.

### Named Rules
**The Continuous Rail Plumb-Line Rule.** On desktop viewports (`> 960px`), the left navigation/control rail and right telemetry rail form uninterrupted vertical plumb lines from top to bottom of the viewport. Never break full-bleed sections across those outer rail borders.

**The Proportional Basin Unit Rule.** Inside `.basin-viewport` above `960px`, size typography, icons, and radii via `--u: calc(100cqw / 1376)` rather than fixed `px` or `rem` values so the 40-region spatial composition preserves exact proportion at every desktop width.

**The Dissolving Responsive Wrapper Rule.** Never duplicate DOM nodes to serve separate desktop and mobile layouts. Use shared semantic markup with `display: contents` above `960px` and flex/grid containers at `<= 960px` so a single accessible DOM tree powers both regimes.

## Elevation & Depth

Surfaces eschew drop-shadow hierarchies in favor of material stratification—layering translucent kozo paper veils, `1px` mineral ink rules, feathered raster plates, and live canvas rings across a strict 8-level z-axis (`z-index: 0` to `7`):

1. **Tiled Washi Ground (`z-index: 0–1`):** `/assets/plates/washi-paper.png` (`560x160` px, SHA-256 `db2c62f0776ec0fd07deeef36519ac837e2eaa725d9e841f4ec2d91987c0432f`) repeats seamlessly across `.basin-viewport` (`calc(560 * var(--u)) calc(160 * var(--u))`), `.portfolio-surface`, and `.reviews-page-shell` (`560px 160px`, scaling to `420px 120px` at `<= 960px`).
2. **Retired: Suminagashi Swirl Plate.** The basin no longer uses a raster starting image. `/assets/plates/suminagashi-swirl.png` and the `.plate-suminagashi` CSS remain in the repo but nothing renders them.
3. **Interactive Fluid Canvas (`z-index: 2`):** `.suminagashi-live-canvas` (`position: absolute; inset: 0; pointer-events: none; mix-blend-mode: multiply`) paints the vector ink so washi fibre shows through every ring. It is always feathered:
   - Desktop `/`: the ink is clipped to the basin (`10.47%`–`92.3%`). A radial `destination-out` veil centred on the headline (`0.29W, 0.3H`) lifts ink away from the copy.
   - `/GameReviews` `.reviews-masthead`: `opacity: 0.9`. Intersected masks run `to bottom #000 70% → transparent` and `to left #000 45% → transparent 92%`. Drops land in the right `min(560px, 52%)`.
   - Mobile `/` (`<= 960px`): `opacity: 0.72`. Intersected masks run bottom `#000 300px → transparent 470px` and left `#000 30% → transparent 85%`.
4. **Rail Frames, Dossier Veils & Foreground Copy (`z-index: 5–7`):** Structural rail borders (`z-index: 5`), hairline dividers and `0.95`-alpha dossier cards (`z-index: 6`), and interactive controls and typography (`z-index: 7`) sit cleanly atop the water surface.

### Shadow Vocabulary
- **Dossier Hover Lift** (`box-shadow: 0 8px 22px rgba(10, 26, 51, 0.06)`): Paired with border darkening (`#b8b9b5` to `#8f939d`) when hovering `.dossier-card`.
- **Primary CTA Hover Lift** (`box-shadow: 0 6px 18px rgba(8, 23, 48, 0.16)`): Paired with `transform: translateY(-1px)` and `#12264a` fill lightening when hovering `.r-cta-primary`.

### Named Rules
**The Flat-At-Rest Paper Rule.** Every card, button, pill, input, and rail sits completely flat (`box-shadow: none`) at rest. Soft indigo-tinted shadows appear only in response to pointer hover.

**The Feathered Plate Mask Rule.** Shipping raster plates must feather into `--washi-ground` via CSS `mask-image` linear gradients (`mask-composite: intersect` / `-webkit-mask-composite: source-in` on corner plates) and drop to `0.42` opacity whenever positioned near display headers or mobile reading columns.

## Shapes

The form language contrasts crisp rectilinear drafting (`5px`–`7px` architectural radii and `1px` rules) against pure `50%` circular fluid apertures and organic quadratic Bézier ink rings:

- **Architectural Containers & Controls (`5px`–`7px`):** Primary hero CTA uses `calc(7 * var(--u))` on desktop (`6px` on mobile); dossier cards, search fields, segmented sort groups, empty/error state boxes, action buttons, and the mobile fluid instrument card use `6px` (`calc(6 * var(--u))` on desktop dossier cards); genre filter pills use a slightly tighter `5px` radius—deliberately avoiding pill-shaped `9999px` tag lozenges so filter controls read like index tabs.
- **Micro-Meter Segments (`1px`):** The 5-bar `.score-segments` rating meter (`120px` total width, `4px` height, `4px` gap) uses crisp `1px` corners so fractional score fills (`4.5/5`, `4.0/5`) read with vernier precision.
- **Circular Instrument Apertures (`50%`):** Active navigation icon badges (`24px`), fluid mode buttons (`calc(30.5 * var(--u))` on desktop, `28px` on mobile, `24px` on subpages), viscosity slider thumbs (`calc(10.8 * var(--u))` on desktop, `14px` on mobile), and the `BasinFlowDial` outer bezel (`viewBox="0 0 46 46"`, `r="21"`) are true circles—echoing concentric ink droplets expanding on water.
- **Custom Stroke Iconography:** All UI icons are authored inline SVGs in `1px`–`1.4px` stroke weight (`SuminagashiFanIcon` with 9 rotational curved vanes at `40°` increments around a `r="1.95"` hub, `BasinFlowDial` with dashed `1.15 2.15` calibration arc and dynamic needle, minimal geometric house/frame/search glyphs). Never substitute emoji or third-party icon packs.

## Components

Every component pairs quiet paper-and-rule restraint at rest with crisp indigo-and-washi state polarity.

### Buttons
- **Shape:** Gently squared architectural corners (`calc(7 * var(--u))` on desktop hero CTA, `6px` on mobile and subpage action buttons).
- **Primary (`.r-cta-primary`, `.critique-action-btn`):** Deep Sumi Indigo (`#081730` / `#071730`) enriched with a subtle internal radial sheen (`radial-gradient(125% 150% at 78% 20%, #132a52 0%, #071730 60%, #051126 100%)`), Washi Reserve text (`#f0f1ee` / `#e8ecee`), uppercase `IBM Plex Sans Condensed` (`0.80rem`–`0.82rem` / `calc(14.6 * var(--u))`, `letter-spacing: 0.055em`–`0.06em`), `44px` mobile touch height (`0.65rem 1.15rem` padding on subpage action buttons).
- **Hover / Focus / Active:** Hover lightens base fill to `#12264a`, lifts `translateY(-1px)`, and casts `0 6px 18px rgba(8, 23, 48, 0.16)` over `260ms cubic-bezier(0.16, 1, 0.3, 1)`; `:active` returns to `translateY(0)`; `:focus-visible` renders a `2px solid #1e2d4a` outline with `2px` offset.
- **Secondary / Inline Editorial (`.r-cta-secondary`, `.critique-clear-inline`):** Transparent background; `.r-cta-secondary` sets `Fira Sans Condensed` (`calc(19.1 * var(--u))` desktop / `1.02rem` mobile) in `#16181b` anchored by a `1.5px` `#20242c` baseline rule (`text-underline-offset: 4px` on mobile and footer links), shifting text to Living Indigo Current (`#1e2d4a`) on hover. `.critique-clear-inline` renders an uppercase `0.78rem` weight `600` `Reset` action in `#1e2d4a` inside the search field whenever filters are active.

### Chips
- **Style (`.genre-filter-pill` & `.critique-sort-btn`):** Architectural index tabs (`5px` radius on standalone genre pills; `6px` outer container with `1px solid #b8b9b5` internal dividers on `.critique-sort-group`). Unselected surface uses Lifted Washi Veil (`rgba(242, 241, 239, 0.92)`), `1px solid #b8b9b5` border, and uppercase `IBM Plex Sans Condensed` (`0.75rem`–`0.78rem`, weight `500`, `letter-spacing: 0.05em`) in `#292e37`–`#2f343e`.
- **State:** Selected state (`.is-selected` paired with `aria-pressed="true"`) inverts cleanly to solid Deep Sumi Indigo (`#081730`) border and fill with `#f0f1ee` text.

### Cards / Containers
- **Corner Style:** Crisp `6px` radius (`calc(6 * var(--u))` on desktop dossier cards).
- **Background:** Lifted Washi Veil at `rgba(242, 241, 239, 0.95)` so underlying marbled currents soften without disappearing.
- **Shadow Strategy:** Flat at rest (`box-shadow: none`); `.dossier-card:hover` shifts border to `#8f939d` and adds `0 8px 22px rgba(10, 26, 51, 0.06)`.
- **Border:** `1px solid #b8b9b5` on cards and `.critique-state-box`; below-the-fold `.ledger-role-block` and `.critique-entry` containers omit box borders entirely, using `1px solid #c4c5c0` / `#d4d5cf` / `#dcddd7` horizontal ledger rules instead.
- **Internal Padding:** `1.05rem 1.15rem` on responsive `.m-card-unit` cards; `2.25rem` on `.critique-state-box` loading/empty/error containers; `clamp(1.85rem, 3vw, 2.5rem) 0` vertical rhythm on `.critique-entry` rows. Each `.critique-entry` pairs a `185px` left metadata column (`IBM Plex Mono` `1.55rem` rating readout, 5-segment `.score-segments` bar, uppercase genre list) with a `66ch` prose column. (Note: on desktop `.basin-viewport`, `.dossier-card` elements are positioned backdrop plates paired with measured coordinate text nodes via `display: contents`; all new surfaces should use normal semantic parent containment like `.m-card-unit` and `.critique-state-box`.)

### Inputs / Fields
- **Style (`.critique-search-field`):** `42px` fixed height, `max-width: 460px`, `rgba(242, 241, 239, 0.95)` background, `1px solid #a8aab0` border, `6px` radius, `0 0.75rem` horizontal padding, leading `15px` stroke magnifier SVG (`#464b57`), `Fira Sans Condensed` `1.02rem` input text (`#0e1015`), and `#535865` placeholder.
- **Focus:** `.critique-search-field:focus-within` transitions border color to Living Indigo Current (`#1e2d4a`).
- **Range Control (`.viscosity-range`):** Custom-styled `<input type="range" min="0.05" max="0.37" step="0.01">` (`0.14` initial default). Renders a dual-layer `background` linear-gradient track—a `3px` active `#4e545f` fill sized dynamically via `--visc-pct` over a `2px` `#b8bab9` full track—topped by a `50%` circular `#081835` thumb (`calc(10.8 * var(--u))` desktop, `14px` mobile).
- **Empty / Loading / Error States:** Handled inline via `.critique-state-box` (`role="status"` or `role="alert"`) naming the exact filter query or origin failure and pairing it with a `.critique-action-btn` recovery (`Show All N Reviews` or `Retry Loading Reviews`).

### Navigation
- **Architecture:** Persistent left vertical rail on desktop (`.r-left-rail` on `/`, sticky `152px` `.subpage-rail-left` on `/GameReviews`) collapsing into `.m-topbar` / static header bar at `<= 960px` (`min-height: 36px` touch targets).
- **Typography & States:** Uppercase `IBM Plex Sans Condensed` (`calc(11 * var(--u))` / `0.72rem`–`0.75rem`, `letter-spacing: 0.05em`). The active route (`aria-current="page"`) elevates weight to `600`, darkens text to `#09162f` / `#0f1626`, and encloses its `12px`–`14px` `#f2f1ef` stroke icon inside a `24px` (`calc(24 * var(--u))`) solid `#09162f` circle (`.nav-badge-active` / `.subpage-badge-active`). Inactive internal links render outline icons (`#434750`–`#474a4d`), followed below a `#d3d3cd` divider by external `GITHUB` and `LINKEDIN` links with `#0e1726` / `#0a1826` marks.

### Interactive Suminagashi Fluid Basin & Telemetry
The signature experience (`FluidBasinCanvas.tsx` + `src/projects/fluid/*` + left-rail fluid controls + right-rail telemetry) treats **ink as geometry and water as a field**. That is why stirring never blurs.
- **Vector Ink (`fluid/inkLayer.ts`):** Each drop is a closed polygon (`Float32Array`) whose vertices ride the water with midpoint RK2.
  - Drops bloom by Jaffer's exact area-preserving displacement, `|p′−c|² = |p−c|² + ΔR²`, eased over `~0.3–0.6s`.
  - Painter's order reproduces the rings, because each newer drop sits inside the hole it pushed into older ink. Clear-water drops paint with `destination-out`.
  - Adaptive resampling keeps edges `~2.4px` on screen: Catmull-Rom splits on long edges, merges where vertices bunch up.
  - A vertex budget (`75k` desktop, `45k` mobile and masthead) lengthens edges first. Only as a last resort does it fade out the most thread-like drops (high perimeter, little area), so big shapes survive hard stirring.
- **Water (`fluid/flowField.ts`):** A CPU stable-fluids solver on a `~6500`-cell MAC grid.
  - Steps: semi-Lagrangian RK2 self-advection, vorticity confinement, exponential damping, warm-started SOR pressure projection (`40` iterations, `ω = 1.82`), free-slip walls.
  - Stirs are stream-function dipoles, so every force is exactly divergence-free and drop areas stay constant.
  - The field sleeps when calm, and the loop pauses offscreen and in hidden tabs.
- **Physics-Generated Opening (`fluid/opening.ts`):** There is no starting image. A seeded RNG builds a new script each visit:
  - 2–4 drop sites (by stage area), each with 9–14 alternating ink/clear rings. At most one beni ring.
  - 7–12 specks.
  - Two Bézier stirring strokes along the stage's long axis, bending through the sites. Shallow stages such as the masthead and mobile get one slower stroke.
  - Reduced motion fast-forwards the same physics and shows the finished composition still.
- **Pointer Play:** Ignores events from `a, button, input, label, select, textarea`.
  - Click (`< 7px` movement): drops an ink ring with a clear collar.
  - Hold `260ms`: drips, alternating ink and clear every `210ms`.
  - Drag: stirs the water. Hand speed is capped so a flick swirls rather than shreds, and momentum carries on after release.
  - Mouse hover: leaves a faint wake.
- **Three Physical Fluid Verbs:**
  - `DROP` (default active): Enables stirring and drops. The rail button drops a larger ring at a random stage point.
  - `FAN`: Drives a continuous gentle breeze across the water.
  - `STILL`: Disables stirring, zeroes vorticity and damps the water hard until it settles.
- **Coupled Viscosity & Telemetry:** Shared React state (`App.tsx`) couples `fluidMode`, `viscosity` and `flowNormalized`. Viscosity runs `0.05`–`0.37` (default `0.14`) and sets damping and vorticity, i.e. how long momentum lasts. Flow updates on a `~90ms` cadence, derived from the field's max speed. The three drive the right-rail `RESOLUTION` (`VECTOR`), the tabular `VISCOSITY` readout, and the `BasinFlowDial` needle (`[0.06π..0.92π]`). These are shared across `/` and `/GameReviews`.

## Do's and Don'ts

### Do:
- **Do** ground every surface in Unbleached Kozo Washi (`#f2f1ef`) with tiled `washi-paper.png` texture and separate sections using `1px` mineral hairlines (`#c4c5c0`, `#c6c6c4`, `#d3d3cd`) rather than heavy background color blocks.
- **Do** restrict chromatic emphasis to Deep Sumi Indigo (`#081730`) and Living Indigo Current (`#1e2d4a`), reserving solid indigo fills for primary CTAs, active navigation/fluid badges, selected filter/sort states, and rating bar fills.
- **Do** set `font-variant-numeric: tabular-nums` (and `--font-mono` where established) on every live telemetry value, rating score, result count, and tenure span so numeric updates never jitter horizontally.
- **Do** feather the ink canvas with directional `linear-gradient` alpha masks (and reduced opacity in subpage mastheads and `<= 960px` viewports) so marbled ink fades into the paper ground before reaching body or display text. Keep ink crisp and fully opaque inside the canvas; grey half-transparent wash is the look this sim exists to avoid.
- **Do** keep long-form engineering descriptions and game review prose within `60ch`–`68ch` line measures in `Fira Sans Condensed` (`1.10rem`–`1.14rem`, `line-height: 1.48`–`1.58`) for unhurried reading.
- **Do** honor `prefers-reduced-motion: reduce` by disabling CSS state transitions and showing the basin's finished composition instantly, without the opening animation.
- **Do** ship only verified career facts from `PRODUCT.md` and finished, authored game reviews in `/reviews.json` with instant client-side search, multi-genre filtering, and recoverable empty/error states.

### Don't:
- **Don't** introduce dark-mode neon terminal themes, glowing cyan/purple gradients, glassmorphic `backdrop-filter: blur()` panels, or generic SaaS Bento icon-card grids.
- **Don't** add kickers, eyebrows, or numbered `"01 / 02"` prefixes above section headings (`<h1>`, `<h2>`); let `Noto Sans HK` headings carry hierarchy on their own weight and baseline rules.
- **Don't** apply resting drop shadows or hard neobrutalist offset shadows (`4px 4px 0`) to cards, inputs, or buttons; surfaces stay flat at rest and lift only on hover with soft indigo-tinted shadows.
- **Don't** load Google Fonts CDNs, system display faces (`Arial`, `Impact`, `Inter`), emoji, or third-party icon libraries; use only the self-hosted `/fonts/*.woff2` voices and authored `1px`–`1.4px` stroke SVGs.
- **Don't** let the interactive fluid `<canvas>` capture pointer events (`pointer-events` must remain `none`) or spawn drops when clicking interactive links, buttons, or inputs, or inside the outer left/right rails (`x < 10.5%` or `x > 92.3%`).
- **Don't** copy the desktop first-viewport's visual-only `<article class="dossier-card" aria-hidden="true" />` sibling backdrop pattern onto new scrollable pages; use semantic parent containers (`.critique-state-box`, `.ledger-role-block`) outside the measured `1376x768` comp stage.
- **Don't** fabricate employers, metrics, portraits, company logos, testimonials, or `"Test review"` placeholder entries.
