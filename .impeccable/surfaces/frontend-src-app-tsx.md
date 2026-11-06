---
version: 1
slug: "frontend-src-app-tsx"
primary_target: "frontend/src/App.tsx"
related_targets: ["frontend/src/components"]
---

# Surface brief: chat app (frontend/src)

## Scope and mode
The whole React app: chat screen, welcome state, conversation drawer, settings sheet, auth and limit sheets. Mode: **Operate** (with long Read passages for verses).

## Audience, job, constraints
Owner + close family, francophone Muslims, iPhone Safari / home-screen PWA, one hand, slow data, night use before Fajr, some older eyes. Jobs: quick question, read and meditate on the Arabic + translation, listen to the recitation, revisit past answers. The question field must be there on open. Keep: green-and-gold logo, the Coran/Hadith/both filter, recitation + auto-play, read-aloud. Avoid: ChatGPT clone, tech/AI look, decorative clichés, clutter.

## Chosen direction and memorable moment
Banco (Sahelian earthen mosque, Djenné/Tombouctou). Memorable moment: the sources come out of the wall as toron beams under each answer, their length showing relevance, and tapping a citation in the text opens that verse with its recitation.

## Unresolved
Whether upgrades are offered at all (no payment flow exists; dead premium CTA and unbacked benefit claims removed).

## Direction contract
THESIS: The answer is built into a Sahelian banco wall: laterite earth holds the shell, kaolin wash holds the reading, and every source juts out of the wall as a palm-wood toron beam you can touch. It refuses the grey chatbot column with grey source cards and the gold-arabesque "Islamic app".

OWN-WORLD: Flat laterite #8E3A1C fields own the header and the composer dock; kaolin #F2E6D8 reading ground; ink #26140C; rônier-brown #4A2A16 beams with clay #C98A5B end-grain; logo green #1E5C3A marks Quran and the primary action, ochre #8A5A12 marks Hadith, gold #D4A63A only on the mark. Night: wall-in-shadow #170D08 with laterite #3E1B0E shell. No gradients, grain or glass. System UI sans; Arabic in Harmattan (West African Naskh).

STORY: The user sees their question answered in plain French, sees exactly which verses and hadiths it stands on, opens one, reads the Arabic, hears it recited, and trusts the answer because the source is right there.

FIRST VIEWPORT: On a 390×844 iPhone: laterite header (menu 44pt left, mark + "IA Coran" centre, new-question + right) under the status bar; kaolin conversation; under each answer a "Sources" wall of toron beams (beam length = relevance, dot = Coran green / Hadith ochre, short reference label), the first source's verse card open below (Arabic 26pt+ right-to-left, French, "Écouter" recitation); laterite dock at the bottom with the Les deux/Coran/Hadith segmented control and a 17pt question field + 44pt send. Empty state: greeting and four suggestions sit just above the dock, in thumb reach.

FORM: Banco, candidate 6 of 7 on the ordered list (alluha, Tombouctou manuscripts, Touba khassida booklets, dawn thread, bazin and indigo, banco mosques, prayer-time board). Raises: console — destructive actions isolated by space; guide map — flat region-scale colour; catalog sleeve — one canonical label per source, the same on beam, citation and card; split-flap — streaming never moves the layout. seed:300df5a91f58f352

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
