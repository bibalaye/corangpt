# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

Mobile web first: used mainly in Safari on iPhone, and meant to be added to the iPhone home screen and opened like an app (standalone PWA). Desktop browsers remain supported.

## Users

The owner (abibou) and close family. A francophone Muslim who uses the assistant daily to practise and understand their religion. Some relatives may be older or have reduced vision. No public launch is planned for now.

## Product Purpose

IA Coran answers questions about Islam in French using only the Quran and Sahih al-Bukhari as sources, and always shows which verses or hadiths each answer relies on, so the user can check them. Success means the user trusts the answer because the sources are right there, can go back to the texts themselves, and keeps coming back for daily questions, reading and listening.

## Positioning

A personal, source-bound assistant rather than a general chatbot: each answer is built from passages retrieved from the Quran (6,236 verses) and Sahih al-Bukhari (7,580 hadiths), shown in Arabic with their French translation and exact reference, and the model is told to say so when the sources don't answer.

## Operating Context

- One-handed use on an iPhone, often on mobile data that is slow or capped.
- Four recurring jobs, all important:
  1. **Quick question** during the day: ask, read the sourced answer, move on.
  2. **Read and meditate**: take time with the Arabic text and its translation.
  3. **Listen to the recitation** of the cited verses (Mishary Alafasy, from everyayah.com).
  4. **Revisit past answers**: find an answer or a verse from an earlier conversation.
- Night use is common (before Fajr, night prayer), in the dark.

## Capabilities and Constraints

- Ask a question in French (Arabic also works); answers stream in Markdown.
- Choose the sources: Quran, Hadith, or both.
- Each answer lists its sources: reference, Arabic text, French translation; Quran verses have recitation audio (with an optional auto-play setting).
- French text-to-speech reads an answer aloud (browser speech synthesis).
- Accounts are required to ask (username + password, email at sign-up); history of the last 50 questions is stored on the server.
- Daily quota per plan (free: 5/day, mensuel: 100/day, max: unlimited), reset at midnight UTC. There is **no payment flow**: the "Passer à Premium" button links to a `#premium` anchor that doesn't exist. Whether upgrades should be offered at all is undecided.
- Deleting a conversation in the sidebar only hides it locally; the server keeps the history.
- LLMs: free tiers only (Gemini, then Groq/Cerebras fallback); availability depends on free quotas.
- Stack: React 19 + Vite + Tailwind 3 (frontend), Django REST API (backend).

## Brand Commitments

- Name: **IA Coran**. Existing logo at `frontend/public/logo.svg` (open book with AI nodes, green and gold).
- Voice: warm, respectful, gentle, pedagogical; never preachy. The assistant says when the sources don't answer and points to a qualified scholar for personal rulings.
- Disclaimer kept visible: "L'IA peut commettre des erreurs. Vérifiez toujours les références."

## Evidence on Hand

- Full Quran text, Arabic + French (`data/raw/quran_complet.json`) and Sahih al-Bukhari, Arabic + French (`data/raw/bukhari_complet.json`).
- Recitation audio per verse from everyayah.com (Mishary Alafasy, 128 kbps).
- No testimonials, user counts, scholar endorsements or press. None may be invented.

## Product Principles

1. **The source is the answer.** Every claim stays traceable to a verse or hadith the user can see, read in Arabic and hear.
2. **Respect for the text.** Quran and Hadith are clearly distinguished, Arabic is shown in full and with care, and sacred text is never used as decoration.
3. **Calm, not engagement.** A tool for practice: no streaks, badges, pressure or upsell noise. Quick when the user is in a hurry, comfortable when they want to linger.
4. **Built for the real conditions:** one hand, small screen, slow network, the dark before dawn, aging eyes.
5. **Humility.** The AI can be wrong; the interface keeps that visible without being anxious about it.

## Accessibility & Inclusion

- Large text must work: honour iOS text-size settings and offer an in-app text size control, Arabic included.
- WCAG 2.2 AA contrast in both light and dark themes; a dark theme comfortable in a dark room.
- Touch targets of at least 44×44 pt; no action that only appears on hover.
- VoiceOver: labelled controls, Arabic marked `lang="ar"` and `dir="rtl"`, live announcement of streamed answers kept reasonable.
- Respect `prefers-reduced-motion`.
- Light on data: no heavy media or large fonts loaded by default.
