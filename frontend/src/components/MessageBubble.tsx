import { lazy, memo, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CircleAlert, RotateCcw, Square, Volume2 } from 'lucide-react'
import type { Message } from '../types/chat'
import { citedLabels, sourceLabel, speakable } from '../lib/sources'
import { useMedia } from '../hooks/useMedia'
import { SourceWall } from './SourceWall'

const Markdown = lazy(() => import('./Markdown'))

interface MessageBubbleProps {
    message: Message
    isLast: boolean
    onRetry: () => void
}

// memo: while an answer streams, only that message re-renders (not the whole thread)
export const MessageBubble = memo(function MessageBubble({ message, isLast, onRetry }: MessageBubbleProps) {
    if (message.role === 'user') {
        return (
            <div className="flex justify-end px-4 pt-6">
                <p className="reading max-w-[85%] whitespace-pre-wrap rounded-[1.25rem] rounded-br-md bg-sunk px-4 py-2.5 text-ink">
                    {message.content}
                </p>
            </div>
        )
    }
    return <AssistantMessage message={message} isLast={isLast} onRetry={onRetry} />
})

function AssistantMessage({ message, isLast, onRetry }: MessageBubbleProps) {
    const media = useMedia()
    // Most relevant first, so the longest beam is always the top one
    const sources = useMemo(
        () => [...(message.sources ?? [])].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),
        [message.sources]
    )
    // An answer that streams in this session gets the beam animation and auto-play
    const [fresh] = useState(() => !!message.isStreaming)
    const [openLabel, setOpenLabel] = useState<string | null>(null)
    const wallRef = useRef<HTMLDivElement>(null)
    const knownLabels = useMemo(() => new Set(sources.map(sourceLabel)), [sources])
    const done = !message.isStreaming
    const speaking = media.now?.kind === 'speech' && media.now.id === message.id

    // Once complete, open the first passage the answer actually cites (the top-scored one if none is cited)
    const leadLabel = useMemo(() => {
        if (!done || sources.length === 0) return null
        return citedLabels(message.content).find(l => knownLabels.has(l)) ?? sourceLabel(sources[0])
    }, [done, sources, knownLabels, message.content])

    useEffect(() => {
        if (leadLabel && openLabel === null) setOpenLabel(leadLabel)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [leadLabel])

    const openCitation = useCallback((label: string) => {
        setOpenLabel(label)
        requestAnimationFrame(() => {
            // Scroll the thread only: scrollIntoView would also move the page and push the header away
            const row = wallRef.current?.querySelector<HTMLElement>('[aria-expanded="true"]')
            const thread = row?.closest('main')
            if (!row || !thread) return
            const top = thread.scrollTop + row.getBoundingClientRect().top - thread.getBoundingClientRect().top - 8
            thread.scrollTo({ top, behavior: 'smooth' })
        })
    }, [])

    const status = !done
        ? (sources.length === 0 ? 'Recherche des passages…'
            : message.content ? 'Rédaction de la réponse…'
                : `${sources.length} ${sources.length > 1 ? 'passages trouvés' : 'passage trouvé'}, rédaction…`)
        : null

    return (
        <article aria-busy={!done} aria-label="Réponse" className="px-4 pt-5">
            {/* One fixed-height row: progress while streaming, then the read-aloud action — nothing jumps */}
            <div className="flex min-h-11 items-center" aria-live="polite">
                {status ? (
                    <p className="flex items-center gap-2.5 text-[0.9375rem] text-ink-3">
                        <span aria-hidden="true" className="flex flex-col gap-[3px]">
                            {[14, 10, 6].map((w, i) => (
                                <span key={w} className="block h-[3px] animate-breathe rounded-r-sm bg-ronier" style={{ width: w, animationDelay: `${i * 180}ms` }} />
                            ))}
                        </span>
                        {status}
                    </p>
                ) : message.content && !message.error && media.speechSupported ? (
                    <button
                        type="button"
                        onClick={() => media.toggleSpeech(message.id, speakable(message.content))}
                        className="press -ml-2 flex h-11 items-center gap-2 rounded-xl px-2 text-[0.9375rem] font-semibold text-ink-2 hover:bg-sunk"
                    >
                        {speaking ? <Square aria-hidden="true" size={16} /> : <Volume2 aria-hidden="true" size={18} />}
                        {speaking ? 'Arrêter la lecture' : 'Écouter la réponse'}
                    </button>
                ) : null}
            </div>

            {message.content && (
                <div className="prose-answer">
                    <Suspense fallback={<p className="whitespace-pre-wrap">{message.content}</p>}>
                        <Markdown knownLabels={knownLabels} onCitation={done ? openCitation : undefined}>
                            {message.content}
                        </Markdown>
                    </Suspense>
                </div>
            )}

            {message.error && (
                <div role="alert" className="mt-3 flex items-start gap-3 rounded-2xl bg-danger/10 px-4 py-3 text-ink">
                    <CircleAlert aria-hidden="true" size={20} className="mt-0.5 shrink-0 text-danger" />
                    <div className="min-w-0 flex-1">
                        <p className="reading">{message.error}</p>
                        {isLast && (
                            <button type="button" onClick={onRetry} className="press mt-2 flex h-11 items-center gap-2 rounded-xl bg-ink px-4 font-semibold text-ground">
                                <RotateCcw aria-hidden="true" size={16} />
                                Réessayer
                            </button>
                        )}
                    </div>
                </div>
            )}

            {done && sources.length > 0 && (
                <div ref={wallRef}>
                    <SourceWall
                        messageId={message.id}
                        sources={sources}
                        openLabel={openLabel}
                        onOpen={setOpenLabel}
                        fresh={fresh}
                        leadLabel={leadLabel}
                    />
                </div>
            )}
        </article>
    )
}
