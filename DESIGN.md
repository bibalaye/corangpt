---
name: IA Coran
description: A source-bound Quran and Hadith assistant built like a Sahelian banco wall.
colors:
  shell: "#8E3A1C"
  shell-deep: "#6E2A12"
  on-shell: "#F7EBDD"
  on-shell-2: "#EBC9B3"
  quran: "#1E5C3A"
  on-quran: "#F7EBDD"
  hadith: "#8A5A12"
  ronier: "#4A2A16"
  clay: "#C98A5B"
  danger: "#A3261B"
  ground: "#F2E6D8"
  surface: "#FBF5EC"
  sunk: "#E8D6C1"
  line: "#D9C2A8"
  ink: "#26140C"
  ink-2: "#634331"
  ink-3: "#7D5A44"
  shell-night: "#3E1B0E"
  shell-deep-night: "#2A1209"
  on-shell-night: "#F2E4D2"
  on-shell-2-night: "#D4B29A"
  quran-night: "#6CC093"
  on-quran-night: "#170D08"
  hadith-night: "#E0AE5E"
  ronier-night: "#9B6A45"
  clay-night: "#D9A57A"
  danger-night: "#F08A7E"
  ground-night: "#170D08"
  surface-night: "#24150D"
  sunk-night: "#2F1C12"
  line-night: "#3E2719"
  ink-night: "#F2E4D2"
  ink-2-night: "#C9AD94"
  ink-3-night: "#A8896F"
typography:
  display-arabic:
    fontFamily: "Salawat, Harmattan, Geeza Pro, Noto Naskh Arabic, serif"
    fontSize: "2.75rem"
    fontWeight: 400
    lineHeight: 1.35
  reading-arabic:
    fontFamily: "Salawat, Harmattan, Geeza Pro, Noto Naskh Arabic, serif"
    fontSize: "calc(1.75rem * var(--text-scale))"
    fontWeight: 400
    lineHeight: 1.95
  headline:
    fontFamily: "Salawat, -apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, system-ui, Roboto, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1.375
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Salawat, -apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, system-ui, Roboto, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "-0.01em"
  reading:
    fontFamily: "Salawat, -apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, system-ui, Roboto, sans-serif"
    fontSize: "calc(1rem * var(--text-scale))"
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: "Salawat, -apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, system-ui, Roboto, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Salawat, -apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, system-ui, Roboto, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.375
  caption:
    fontFamily: "Salawat, -apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, system-ui, Roboto, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1rem
rounded:
  beam-end: "3px"
  sm: "4px"
  focus: "6px"
  lg: "8px"
  segment: "10px"
  xl: "12px"
  2xl: "16px"
  bubble: "20px"
  composer: "24px"
  full: "9999px"
spacing:
  hairline: "2px"
  dock: "12px"
  gutter: "16px"
  sheet: "20px"
  touch: "44px"
  row: "48px"
  header: "56px"
  column: "42rem"
components:
  button-primary:
    backgroundColor: "{colors.quran}"
    textColor: "{colors.on-quran}"
    rounded: "{rounded.2xl}"
    height: "48px"
    typography: "{typography.title}"
  button-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    rounded: "{rounded.2xl}"
    height: "48px"
  button-recite:
    backgroundColor: "{colors.quran}"
    textColor: "{colors.on-quran}"
    rounded: "{rounded.full}"
    height: "44px"
    padding: "0 16px"
  button-send:
    backgroundColor: "{colors.quran}"
    textColor: "{colors.on-quran}"
    rounded: "{rounded.full}"
    size: "44px"
  button-send-disabled:
    backgroundColor: "{colors.sunk}"
    textColor: "{colors.ink-3}"
  icon-button-shell:
    textColor: "{colors.on-shell}"
    rounded: "{rounded.xl}"
    size: "44px"
  icon-button-shell-active:
    backgroundColor: "{colors.shell-deep}"
  header:
    backgroundColor: "{colors.shell}"
    textColor: "{colors.on-shell}"
    height: "56px"
  dock:
    backgroundColor: "{colors.shell}"
    padding: "10px 12px 0"
  dock-segmented:
    backgroundColor: "{colors.shell-deep}"
    textColor: "{colors.on-shell-2}"
    rounded: "{rounded.xl}"
    padding: "2px"
  dock-segment-selected:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.shell}"
    rounded: "{rounded.segment}"
    height: "44px"
  composer-field:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.composer}"
    padding: "4px 4px 4px 16px"
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    height: "48px"
    padding: "0 16px"
  source-beam:
    backgroundColor: "{colors.ronier}"
    rounded: "{rounded.beam-end}"
    height: "12px"
  source-beam-end:
    backgroundColor: "{colors.clay}"
    width: "6px"
  source-row:
    textColor: "{colors.ink}"
    height: "48px"
  source-row-open:
    backgroundColor: "{colors.sunk}"
  user-bubble:
    backgroundColor: "{colors.sunk}"
    textColor: "{colors.ink}"
    rounded: "{rounded.bubble}"
    padding: "10px 16px"
  suggestion-list:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.2xl}"
  sheet:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.bubble}"
    width: "34rem"
---

# Design System: IA Coran

## Overview

**Creative North Star: "The Banco Wall"**

The interface is built like a Sahelian earthen mosque (Djenné, Tombouctou). Flat laterite earth forms the shell: the header at the top and the composer dock at the bottom are solid fields of the same burnt red, and the conversation between them is a kaolin-washed wall that holds the reading. Every source an answer relies on comes out of that wall as a palm-wood toron beam. The beam is dark rônier brown with a lighter clay end-grain, and its length shows how relevant the passage is. The same beam end appears at the citation in the text, so the wall, the citation and the opened verse all carry one label and one material.

At night the wall falls into shadow before Fajr. Values invert to near-black earth (#170D08) under a darker laterite shell, but nothing else about the world changes. Density is calm and one-handed: one column at most 42rem wide, 16px gutters, every control at least 44px, and actions placed in thumb reach at the bottom edge. Colour sits in large flat regions. There is no gradient, grain, glass or ornament in the interface. Sacred text is never used as decoration; Arabic appears only as content, set large in a West African Naskh.

**Key Characteristics:**
- Flat laterite shell (header and dock) holding a kaolin reading ground; no gradients, textures or translucency in the UI.
- Toron beams (rônier body, clay end-grain, square at the wall, rounded at the cut end) are the system's one signature form, used for source relevance, inline citations and the streaming indicator.
- Colour carries meaning: green is Quran and the primary action, ochre is Hadith, laterite is the structure.
- System sans for French UI; Harmattan for all Arabic.
- Two complete palettes (day and night) bound to the same token names.

## Colors

Earth pigments only: laterite, kaolin, rônier wood, clay, plus the logo's green and an ochre. Each token is stored as RGB channels on `:root` (day) and `.dark` (night) so alpha variants such as `sunk/60` and `danger/10` stay bound to the palette.

### Primary
- **Laterite Shell** (shell): the header and the composer dock, the full-bleed `html` background behind the safe areas, the signed-in avatar disc and the `theme-color` of the browser chrome. Structure, never a button fill.
- **Fired Laterite** (shell-deep): the recessed track of the dock's segmented control and the pressed state of icon buttons on the shell.
- **Shell Kaolin / Shell Dust** (on-shell, on-shell-2): text and icons on the shell; on-shell-2 for unselected segments and the dock disclaimer.

### Secondary
- **Logo Green** (quran): everything that is Quran (source dots, citations, the Écouter recitation pill) and the primary action (send, Nouvelle question, Se connecter), plus the focus ring, caret and selection tint. On-quran is the text on it.
- **Sahel Ochre** (hadith): Hadith source dots and Hadith citations only.

### Tertiary
- **Rônier Wood** (ronier): the beam body in the sources wall, at citations and in the three-bar streaming indicator.
- **Clay End-Grain** (clay): the cut end of every beam, list markers in answers, and the limit icon at night.

### Neutral
- **Kaolin Ground** (ground): the reading ground, sheets and drawer by day, the composer field, the selected dock segment.
- **Fresh Wash** (surface): suggestion list, text fields, selected segment thumbs in sheets; at night the sheet and drawer background, one step above the page.
- **Sunk Plaster** (sunk): the user's question bubble, the open source row, segmented tracks in sheets, hover and press fills, the disabled send button.
- **Seam** (line): hairline dividers, field borders, the sidebar edge, scrollbars, the off state of the toggle.
- **Ink / Ink 2 / Ink 3** (ink, ink-2, ink-3): primary text; secondary text and translations; metadata, placeholders, chevrons. Ink is also the fill of neutral solid buttons (Réessayer, Compris, Se connecter in the drawer).
- **Danger** (danger): destructive confirmation fill and error tints at 10% alpha.

### Named Rules
**The Meaning Before Colour Rule.** Green means Quran or the primary action; ochre means Hadith. Neither is used for decoration, and a source is never marked by colour alone (the dot is paired with the reference and a screen-reader label).

**The Shell Is Structure Rule.** Laterite fills only the header, the dock and their parts. Content and buttons in the reading ground never take the shell colour as a fill.

**The Gold Belongs To The Mark Rule.** Gold appears only inside the logo mark. No gold UI accents, borders or arabesques.

## Typography

**Display Font:** Harmattan (West African Naskh, self-hosted Arabic subset), falling back to Geeza Pro and Noto Naskh Arabic
**Body Font:** System UI sans (-apple-system, SF Pro Text, Segoe UI, Roboto)
**Salawat:** a 2 KB Amiri subset for U+FDFA (ﷺ) only, first in both stacks

**Character:** The French interface is the phone's own voice, plain and legible; the Arabic is the only display type, given room and a regional Naskh rather than a generic one. iOS Dynamic Type sets the base size (`font: -apple-system-body`), and the in-app text size multiplies the reading roles through `--text-scale`.

### Hierarchy
- **Display Arabic** (400, 2.75rem, 1.35): the Arabic greeting on the welcome screen. The largest type in the system.
- **Reading Arabic** (400, 1.75rem × text-scale, 1.95): verse and hadith text, right-to-left, right-aligned.
- **Headline** (600, 1.375rem, snug, -0.01em): the welcome line under the greeting and sheet titles (the auth sheet title steps to 1.5rem, the settings title to 1.25rem).
- **Title** (600, 1.0625rem, -0.01em): the "IA Coran" wordmark in the header and the drawer title.
- **Reading** (400, 1rem × text-scale, 1.6): answers, translations, the question bubble. Answer subheads stay in this role at 1.08em semibold.
- **Body** (400 or 600, 0.9375rem): source details, conversation rows, secondary actions.
- **Label** (600, 0.8125rem, sentence case): section labels that are real headings, such as the passage count above the wall and the date groups in the drawer.
- **Caption** (400, 0.75rem/1rem): the dock disclaimer and the settings footer.

### Named Rules
**The Arabic Is Never Small Rule.** Arabic text is at least 1.75rem and scales with the reading size; it is never truncated mid-verse without a "Lire le texte entier" control.

**The 16px Field Rule.** Every input, textarea and select is at least max(1rem, 16px) so Safari never zooms on focus.

## Layout

The screen is a fixed app shell: the document never scrolls, only the conversation thread does. From top to bottom it is the laterite header (56px plus the top safe area), the scrolling kaolin thread, and the laterite dock (padded by the bottom safe area). Content sits in one centred column at most 42rem wide with 16px side gutters; the sources wall bleeds to the screen edge on mobile (`-mx-4`) so the beams come straight out of the wall, and it returns into the column from 640px.

Rhythm: 24px above each question, 20px above each answer, 24px above the sources wall. Rows are at least 48px (source rows, conversation rows) and suggestion rows 56px; every tappable target is at least 44px. Sheets use 20px inner padding and add the bottom safe area to their padding.

Responsive behaviour: below 640px sheets rise from the bottom edge at full width; from 640px they are centred dialogs at most 34rem wide. From 1024px the conversation panel becomes a persistent 20rem sidebar with a seam on its right edge, and the header's menu and new-question buttons are hidden while keeping their space. The empty state pushes the greeting and suggestions to the bottom of the thread, just above the dock.

**The Thumb Reach Rule.** Primary actions live at the bottom edge (dock, sheet buttons). The header holds only navigation (menu, new question).

**The Still Layout Rule.** Streaming never moves the layout: the status row has a fixed 44px height that later holds the read-aloud action, and citations keep the same size, colour and beam while the answer streams as when it is complete; only the 2px underline arrives once they become tappable, and it does not reflow.

## Elevation & Depth

The system is flat. Depth comes from tone: the shell sits at the edges, the ground holds the reading, sunk plaster recesses (open rows, tracks, the question bubble) and fresh wash raises (fields, suggestions, sheets at night). At night the sheet and drawer move to surface so their edge shows against the page, with a 1px seam line on the sheet's top edge. Dialogs dim the page with a 50% night-earth backdrop.

### Shadow Vocabulary
- **Thumb lift** (`box-shadow: 0 1px 3px rgb(38 20 12 / 0.12)`): the selected thumb of a segmented control inside sheets (theme, text size, sign-in/sign-up).
- **Knob lift** (`box-shadow: 0 1px 3px rgb(38 20 12 / 0.25)`): the knob of the auto-recitation toggle.
- **Night sheet edge** (`box-shadow: 0 -1px 0 rgb(var(--line))`): the top edge of a sheet at night.

### Named Rules
**The Earth Does Not Float Rule.** Cards, rows, buttons and the header carry no drop shadow. Shadows are limited to the 1-3px lifts above, on small moving parts.

## Shapes

Corners are soft and earthen, nested by size: 12px for controls, 16px for large buttons and grouped lists, 20px for the question bubble and the sheet's top corners, 24px for the composer field, full rounds for the send button, the recitation pill, source dots, the avatar and the toggle. Inner radii stay concentric (the 10px dock segment sits in a 12px track with 2px padding). The question bubble narrows its bottom-right corner to 6px, pointing at the asker.

The beam is the one non-symmetric form. It is square on the left, where it enters the wall, and rounded 3px only on its right, cut end (2px at citation size). Borders are rare: hairline seams for dividers, the sidebar edge and text fields only.

## Components

### Buttons
Solid, quiet and thumb-sized.
- **Shape:** large actions 48px tall with 16px corners; compact actions 44px with 12px corners.
- **Primary:** logo green fill with kaolin text, semibold (Nouvelle question, Se connecter in the auth sheet). Hover drops the fill to 90% opacity.
- **Ink:** ink fill with ground text for neutral confirmations (Compris, Réessayer, sign-in prompts).
- **Destructive:** danger fill with ground text, only inside the confirmation block; a quiet danger-text button for sign-out.
- **Text:** semibold green text, 44px tall, for "Voir les N autres passages" and "Lire le texte entier".
- **Press:** every pressable scales to 0.97 over 120ms with the out curve, so a touch responds without depending on hover. Hover styles apply only on devices that really hover.
- **Focus:** 2px logo-green outline at 2px offset, 6px radius.

### Icon Buttons
44px square with 12px corners, a Lucide line icon at 22px. On the shell they use on-shell icons and press to fired laterite; on the ground they use ink-2 and press to sunk plaster. Every icon button has an aria-label and a title.

### Chips (segmented controls)
- **Dock filter (Les deux / Coran / Hadith):** a fired-laterite track with 2px padding; segments 44px tall, 0.875rem semibold, unselected on-shell-2; the selected segment is a kaolin tile with laterite text (ink at night).
- **Sheet segmented controls:** a sunk track with 4px padding and 16px corners; the selected thumb is fresh wash (seam colour at night) with the thumb-lift shadow.

### Cards / Containers
- **Suggestion list:** one fresh-wash block with 16px corners, divided by seams, 56px rows with a trailing chevron.
- **Question bubble:** sunk plaster, 20px corners with a 6px bottom-right corner, at most 85% of the column, right-aligned.
- **Error block:** danger at 10% over the ground, 16px corners, alert icon in danger, an ink Réessayer button.
- **Sheets:** native `<dialog>`, ground fill (surface at night), rising from the bottom with 20px top corners on mobile and fully rounded and centred from 640px. They enter with a 24px rise and fade over 360ms; the drawer slides in from the left over 320ms, at min(86vw, 22rem).

### Inputs / Fields
- **Composer:** a kaolin capsule (24px corners) on the laterite dock, 16px left padding, auto-growing to 136px, with the 44px send disc inside it. The send disc is green, turns sunk with ink-3 when empty, and becomes an ink stop square while an answer streams. When the daily limit is reached the field turns read-only and explains itself on tap.
- **Form fields:** 48px tall, fresh-wash fill, seam border, 12px corners, 16px padding; focus switches the border to green with a 2px green ring at 25%. Labels sit above in semibold ink; hints in ink-3 below.
- **Toggle:** 52×32 track, green on and seam off, with a 24px knob.

### Navigation
The laterite header: menu (44px) on the left, the mark at 28px with 8px corners and the "IA Coran" title in the centre, new question (44px) on the right. The conversation panel (drawer on mobile, sidebar from 1024px) opens with a laterite title band in the drawer, a full-width green "Nouvelle question" button, date-grouped rows (selected row sunk and semibold), and the account footer with an avatar disc. Delete asks for confirmation inline in a danger-tinted block, set apart by space from the row actions.

### Source Wall (signature)
Under each answer, a label heading gives the count ("8 passages consultés"), then one 48px row per passage: the beam (12px tall, length 1.25rem to 5rem from relevance, rônier body with a 6px clay end), a 10px dot (green for Quran, ochre for Hadith), the canonical reference in semibold ink, the detail in ink-3, and a chevron that rotates when open. The first four rows show; the rest sit behind a text button. An open row turns sunk and reveals the verse card: Arabic, French translation in ink-2, the full reference in caption-sized ink-3, and the green Écouter pill (44px, full round) with loading, pause, resume and retry states. On a fresh answer the beams extrude from the wall (scaleX from the left over 520ms, staggered 55ms) and the card rises in over 360ms.

### Inline Citation
A citation in the answer is the same beam at text size (0.95em by 0.42em, with a 0.22em clay end) followed by the reference in semibold green (Quran) or ochre (Hadith), held on one line. Once the answer is complete it becomes a button: a 2px underline in the corpus colour at 40% alpha appears, and an enlarged invisible hit area opens that source in the wall. A reference the answer cites but the wall does not hold stays plain semibold ink-2 with no beam.

### Streaming Indicator
Three short rônier bars (14, 10 and 6px wide, 3px tall) breathing between 35% and 100% opacity over 1.4s, staggered by 180ms, beside the status text in ink-3.

## Do's and Don'ts

### Do:
- **Do** keep the header and dock solid laterite and the reading area kaolin, in both day and night palettes.
- **Do** use the toron beam (rônier body, clay end, square left, 3px rounded right) for anything that represents a source, and keep one canonical label per source across the beam, the citation and the card.
- **Do** mark Quran in logo green and Hadith in ochre, always paired with the reference text.
- **Do** set every Arabic passage in Harmattan at 1.75rem or more, right-to-left, scaled by the in-app text size.
- **Do** give every control a 44px minimum target and the 0.97 press response; reserve hover for hover-capable devices.
- **Do** use the out curve `cubic-bezier(0.16, 1, 0.3, 1)` for entrances and respect reduced motion (all motion collapses to 1ms).
- **Do** build modals on the native `<dialog>` as bottom sheets on mobile.

### Don't:
- **Don't** add gradients, grain, glass or blur to the interface. The logo mark keeps its own gradient; it is a brand asset, not a UI style.
- **Don't** put gold anywhere but the mark, and don't add arabesques, geometric Islamic patterns or calligraphy as decoration.
- **Don't** use sacred Arabic text as ornament, background or placeholder.
- **Don't** show sources as grey cards in a grey chatbot column; sources are beams in the wall.
- **Don't** add drop shadows to cards, rows, buttons or the header.
- **Don't** let streaming shift the layout or resize or recolour citations when the answer finishes.
- **Don't** fill buttons in the reading ground with the laterite shell colour.
