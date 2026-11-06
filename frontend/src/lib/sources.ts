import type { QuranVerse as Source } from '../types/chat'

export const isQuran = (s: Source) => s.source_type !== 'Hadith'

/**
 * The one canonical label of a source — the same on the beam, in the answer
 * text and on the card: "2:153" for a verse, "Bukhari 1302" for a hadith.
 */
export function sourceLabel(s: Source): string {
    if (s.label) return s.label
    const m = s.metadata as Record<string, unknown> | undefined
    if (isQuran(s)) {
        if (m?.sourate && m?.ayah) return `${m.sourate}:${m.ayah}`
        const match = s.reference.match(/Sourate (\d+).*?Verset (\d+)/)
        return match ? `${match[1]}:${match[2]}` : s.reference
    }
    if (m?.hadith_number) return `Bukhari ${m.hadith_number}`
    const match = s.reference.match(/Hadith (\d+)/)
    return match ? `Bukhari ${match[1]}` : s.reference
}

/** Secondary line: "Al-Baqara · verset 153" / "Livre 23 · Sahih" */
export function sourceDetail(s: Source): string {
    const m = s.metadata as Record<string, unknown> | undefined
    if (isQuran(s)) {
        if (m?.sourate_name) return `${m.sourate_name} · verset ${m.ayah}`
        return s.reference
    }
    const parts = [m?.book_number ? `Livre ${m.book_number}` : null, m?.grade ? String(m.grade) : null]
    return parts.filter(Boolean).join(' · ') || s.reference
}

/** Full reference for screen readers and the card footer */
export function sourceFull(s: Source): string {
    const m = s.metadata as Record<string, unknown> | undefined
    if (isQuran(s) && m?.sourate) return `Sourate ${m.sourate} (${m.sourate_name}), verset ${m.ayah}`
    return s.reference
}

// Citations as written by the assistant: "(2:153)", "(2:153-154)", "(Bukhari 1302)",
// and the long form used by older answers: "Sourate 2 (Al-Baqara), Verset 153".
const SHORT_REF = /\((\d{1,3}:\d{1,3}(?:-\d{1,3})?|Bukhari \d{1,5})\)/g
const LONG_QURAN = /Sourate (\d{1,3}) \(([^)]+)\), Verset (\d{1,3})/g
const LONG_HADITH = /Sahih al-Bukhari, Livre \d+, Hadith (\d{1,5})(?: \([^)]+\))?/g

/** Turn citations into links the Markdown renderer shows as tappable references. */
export function linkifyCitations(markdown: string): string {
    return markdown
        .replace(LONG_QURAN, (text, sourate, _name, ayah) => `[${text}](#ref/${sourate}:${ayah})`)
        .replace(LONG_HADITH, (text, n) => `[${text}](#ref/${encodeURIComponent(`Bukhari ${n}`)})`)
        .replace(SHORT_REF, (_m, label: string) => `[(${label})](#ref/${encodeURIComponent(label)})`)
}

/** Labels cited in an answer, in reading order ("2:153", "Bukhari 1302", …). */
export function citedLabels(markdown: string): string[] {
    const found: { at: number; label: string }[] = []
    for (const m of markdown.matchAll(SHORT_REF)) found.push({ at: m.index ?? 0, label: m[1].split('-')[0] })
    for (const m of markdown.matchAll(LONG_QURAN)) found.push({ at: m.index ?? 0, label: `${m[1]}:${m[3]}` })
    for (const m of markdown.matchAll(LONG_HADITH)) found.push({ at: m.index ?? 0, label: `Bukhari ${m[1]}` })
    return [...new Set(found.sort((a, b) => a.at - b.at).map(f => f.label))]
}

export function refFromHref(href?: string): string | null {
    if (!href?.startsWith('#ref/')) return null
    const label = decodeURIComponent(href.slice(5))
    return label.includes('-') ? label.split('-')[0] : label // "2:153-154" → open 2:153
}

/** Plain text for read-aloud: no Markdown symbols, citations spoken in full. */
export function speakable(markdown: string): string {
    return markdown
        .replace(/\((\d{1,3}):(\d{1,3})(?:-(\d{1,3}))?\)/g, (_m, s, a, b) => `(sourate ${s}, verset ${a}${b ? ` à ${b}` : ''})`)
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/[*_`#>]+/g, '')
        .replace(/^\s*[-•]\s+/gm, '')
        .replace(/\n{2,}/g, '. ')
        .trim()
}
