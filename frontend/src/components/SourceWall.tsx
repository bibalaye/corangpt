import { memo, useEffect, useId, useRef, useState } from 'react'
import { ChevronDown, LoaderCircle, Pause, Play, RotateCcw } from 'lucide-react'
import type { QuranVerse as Source } from '../types/chat'
import { isQuran, sourceDetail, sourceFull, sourceLabel } from '../lib/sources'
import { recitationUrl, useMedia } from '../hooks/useMedia'
import { useSettings } from '../hooks/useSettings'

const VISIBLE = 4

interface SourceWallProps {
    messageId: string
    sources: Source[]
    openLabel: string | null
    onOpen: (label: string | null) => void
    /** True for an answer that just arrived: beams extrude and auto-play may start */
    fresh: boolean
    /** The first passage the answer cites: the one auto-recitation plays */
    leadLabel: string | null
}

/**
 * The sources of an answer, built like a banco wall: each passage juts out as
 * a rônier beam whose length shows how close it is to the question.
 */
export const SourceWall = memo(function SourceWall({ messageId, sources, openLabel, onOpen, fresh, leadLabel }: SourceWallProps) {
    const [showAll, setShowAll] = useState(false)
    const headingId = useId()
    const scores = sources.map(s => s.score ?? 0)
    const max = Math.max(...scores)
    const min = Math.min(...scores)
    const openIndex = sources.findIndex(s => sourceLabel(s) === openLabel)
    const visible = showAll || openIndex >= VISIBLE ? sources : sources.slice(0, VISIBLE)
    const hidden = sources.length - visible.length

    return (
        <section aria-labelledby={headingId} className="mt-6">
            <h3 id={headingId} className="mb-1 text-[0.8125rem] font-semibold text-ink-2">
                {sources.length} {sources.length > 1 ? 'passages consultés' : 'passage consulté'}
            </h3>
            <ul className="-mx-4 sm:mx-0">
                {visible.map((source, i) => {
                    const label = sourceLabel(source)
                    const open = label === openLabel
                    const strength = max > min ? ((source.score ?? 0) - min) / (max - min) : 1
                    const cardId = `${messageId}-src-${i}`
                    return (
                        <li key={`${label}-${i}`} className={open ? 'bg-sunk/60 sm:rounded-xl' : ''}>
                            <button
                                type="button"
                                aria-expanded={open}
                                aria-controls={cardId}
                                onClick={() => onOpen(open ? null : label)}
                                className="press flex min-h-12 w-full items-center gap-3 pr-3 text-left hover:bg-sunk/60 sm:rounded-xl"
                            >
                                {/* The beam: length = relevance; the lighter end is the cut end-grain */}
                                <span
                                    aria-hidden="true"
                                    className={`relative h-3 shrink-0 origin-left rounded-r-[3px] bg-ronier ${fresh ? 'animate-extrude' : ''}`}
                                    style={{ width: `calc(1.25rem + ${(strength * 3.75).toFixed(2)}rem)`, animationDelay: `${i * 55}ms` }}
                                >
                                    <span className="absolute inset-y-0 right-0 w-1.5 rounded-r-[3px] bg-clay" />
                                </span>
                                <span aria-hidden="true" className={`h-2.5 w-2.5 shrink-0 rounded-full ${isQuran(source) ? 'bg-quran' : 'bg-hadith'}`} />
                                <span className="min-w-0 flex-1 truncate">
                                    <span className="font-semibold text-ink">{label}</span>
                                    <span className="sr-only">{isQuran(source) ? ', Coran' : ', Hadith'}</span>
                                    <span className="ml-2 text-[0.9375rem] text-ink-3">{sourceDetail(source)}</span>
                                </span>
                                <ChevronDown aria-hidden="true" size={18} className={`shrink-0 text-ink-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                            </button>
                            {open && <SourceCard id={cardId} messageId={messageId} source={source} autoPlay={fresh && label === leadLabel} />}
                        </li>
                    )
                })}
            </ul>
            {hidden > 0 && (
                <button
                    type="button"
                    onClick={() => setShowAll(true)}
                    className="press mt-1 min-h-11 rounded-xl px-1 text-[0.9375rem] font-semibold text-quran hover:underline"
                >
                    Voir les {hidden} autres passages
                </button>
            )}
        </section>
    )
})

interface SourceCardProps {
    id: string
    messageId: string
    source: Source
    autoPlay: boolean
}

function SourceCard({ id, messageId, source, autoPlay }: SourceCardProps) {
    const media = useMedia()
    const settings = useSettings()
    const label = sourceLabel(source)
    const quran = isQuran(source)
    const m = source.metadata
    const url = quran && m?.sourate && m?.ayah ? recitationUrl(m.sourate, m.ayah) : null
    const mediaId = `${messageId}:${label}`
    const long = source.text_fr.length > 700 || source.text_ar.length > 600
    const [expanded, setExpanded] = useState(!long)
    const autoPlayed = useRef(false)

    useEffect(() => {
        if (autoPlay && settings.autoPlay && url && !autoPlayed.current) {
            autoPlayed.current = true
            media.playRecitation(mediaId, url)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const state = media.now?.kind === 'recitation' && media.now.id === mediaId ? media.now.status : null

    return (
        <div id={id} role="region" aria-label={`${quran ? 'Verset' : 'Hadith'} ${label}`} className="animate-rise px-4 pb-4 pt-1 sm:px-3">
            <p lang="ar" dir="rtl" className={`reading-arabic text-right text-ink ${expanded ? '' : 'line-clamp-4'}`}>
                {source.text_ar}
            </p>
            <p className={`reading mt-2 text-ink-2 ${expanded ? '' : 'line-clamp-5'}`}>{source.text_fr}</p>
            {!expanded && (
                <button type="button" onClick={() => setExpanded(true)} className="press mt-1 min-h-11 font-semibold text-quran">
                    Lire le texte entier
                </button>
            )}
            <div className="mt-3 flex items-center justify-between gap-3">
                <p className="min-w-0 text-[0.8125rem] leading-snug text-ink-3">{sourceFull(source)}</p>
                {url && (
                    <button
                        type="button"
                        onClick={() => media.toggleRecitation(mediaId, url)}
                        aria-label={state === 'playing' ? `Mettre en pause la récitation de ${label}` : `Écouter la récitation de ${label}`}
                        className="press flex h-11 shrink-0 items-center gap-2 rounded-full bg-quran px-4 font-semibold text-quran-on hover:bg-quran/90"
                    >
                        {state === 'loading' ? <LoaderCircle aria-hidden="true" size={18} className="animate-spin" />
                            : state === 'playing' ? <Pause aria-hidden="true" size={18} />
                                : state === 'error' ? <RotateCcw aria-hidden="true" size={18} />
                                    : <Play aria-hidden="true" size={18} />}
                        <span>{state === 'loading' ? 'Chargement' : state === 'playing' ? 'Pause' : state === 'paused' ? 'Reprendre' : state === 'error' ? 'Réessayer' : 'Écouter'}</span>
                    </button>
                )}
            </div>
        </div>
    )
}
