import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { ArrowUp, Square } from 'lucide-react'

export type SourceFilter = 'both' | 'quran' | 'hadith'

const FILTERS: { value: SourceFilter; label: string }[] = [
    { value: 'both', label: 'Les deux' },
    { value: 'quran', label: 'Coran' },
    { value: 'hadith', label: 'Hadith' },
]

interface ChatInputProps {
    onSend: (content: string) => void
    onStop: () => void
    isStreaming: boolean
    isLimitReached?: boolean
    resetTime?: string | null
    onLimitTap?: () => void
    sourceFilter: SourceFilter
    onSourceFilterChange: (filter: SourceFilter) => void
}

/**
 * The laterite dock: which sources to consult, the question field and send.
 * Sits on the bottom edge, in thumb reach, above the home indicator.
 */
export function ChatInput({ onSend, onStop, isStreaming, isLimitReached = false, resetTime, onLimitTap, sourceFilter, onSourceFilterChange }: ChatInputProps) {
    const [value, setValue] = useState('')
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const canSend = value.trim().length > 0 && !isStreaming && !isLimitReached

    useEffect(() => {
        const el = textareaRef.current
        if (!el) return
        el.style.height = 'auto'
        el.style.height = `${Math.min(el.scrollHeight, 136)}px`
    }, [value])

    const submit = (e?: FormEvent) => {
        e?.preventDefault()
        if (!canSend) return
        onSend(value.trim())
        setValue('')
    }

    const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault()
            submit()
        }
    }

    return (
        <form onSubmit={submit} className="shrink-0 bg-shell pb-safe-b">
            <div className="mx-auto w-full max-w-2xl px-3 pt-2.5">
                <fieldset className="flex rounded-xl bg-shell-deep p-0.5">
                    <legend className="sr-only">Sources à consulter</legend>
                    {FILTERS.map(f => (
                        <label key={f.value} className="relative flex-1">
                            <input
                                type="radio"
                                name="source-filter"
                                value={f.value}
                                checked={sourceFilter === f.value}
                                onChange={() => onSourceFilterChange(f.value)}
                                className="peer sr-only"
                            />
                            <span className="press flex h-11 cursor-pointer items-center justify-center rounded-[0.625rem] text-[0.875rem] font-semibold text-on-shell-2 peer-checked:bg-ground peer-checked:text-shell dark:peer-checked:text-ink peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-on-shell">
                                {f.label}
                            </span>
                        </label>
                    ))}
                </fieldset>

                <div className="mt-2 flex items-end gap-2 rounded-[1.5rem] bg-ground p-1 pl-4">
                    <label htmlFor="question" className="sr-only">Votre question</label>
                    <textarea
                        id="question"
                        ref={textareaRef}
                        value={value}
                        onChange={e => setValue(e.target.value)}
                        onKeyDown={onKeyDown}
                        rows={1}
                        enterKeyHint="send"
                        autoComplete="off"
                        spellCheck
                        // readOnly (not disabled) so a tap still explains when the quota comes back
                        readOnly={isLimitReached}
                        aria-disabled={isLimitReached || undefined}
                        onClick={isLimitReached ? onLimitTap : undefined}
                        placeholder={isLimitReached
                            ? (resetTime ? `Limite atteinte · retour dans ${resetTime.replace(' ', ' ')}` : 'Limite du jour atteinte')
                            : 'Posez votre question…'}
                        className="max-h-[8.5rem] min-h-11 flex-1 resize-none bg-transparent py-2.5 leading-6 text-ink placeholder:text-ink-3 focus:outline-none read-only:cursor-not-allowed"
                    />
                    {isStreaming ? (
                        <button
                            type="button"
                            onClick={onStop}
                            aria-label="Arrêter la réponse"
                            className="press grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-ground"
                        >
                            <Square aria-hidden="true" size={14} fill="currentColor" />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={!canSend}
                            aria-label="Envoyer la question"
                            className="press grid h-11 w-11 shrink-0 place-items-center rounded-full bg-quran text-quran-on disabled:bg-sunk disabled:text-ink-3"
                        >
                            <ArrowUp aria-hidden="true" size={20} strokeWidth={2.4} />
                        </button>
                    )}
                </div>

                <p className="py-1.5 text-center text-[0.75rem] leading-4 text-on-shell-2">
                    L'IA peut se tromper. Vérifiez toujours les références.
                </p>
            </div>
        </form>
    )
}
