import { useState, useRef, useEffect, useCallback } from 'react'

interface ChatInputProps {
    onSend: (content: string) => void
    onStop: () => void
    isStreaming: boolean
    isLimitReached?: boolean
    resetTime?: string | null
    sourceFilter: 'both' | 'quran' | 'hadith'
    onSourceFilterChange: (filter: 'both' | 'quran' | 'hadith') => void
}

/**
 * Chat input with auto-resizing textarea, send/stop buttons.
 * Handles Enter to send, Shift+Enter for new line. Includes search source toggle.
 */
export function ChatInput({ onSend, onStop, isStreaming, isLimitReached = false, resetTime, sourceFilter, onSourceFilterChange }: ChatInputProps) {
    const [value, setValue] = useState('')
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const canSend = value.trim().length > 0 && !isStreaming && !isLimitReached

    // Auto-resize textarea
    useEffect(() => {
        const el = textareaRef.current
        if (!el) return
        el.style.height = 'auto'
        el.style.height = `${Math.min(el.scrollHeight, 200)}px`
    }, [value])

    // Focus on mount
    useEffect(() => {
        textareaRef.current?.focus()
    }, [])

    const handleSubmit = useCallback(() => {
        if (!canSend) return
        onSend(value.trim())
        setValue('')
        // Reset height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
        }
    }, [canSend, value, onSend])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    return (
        <div className="px-4 md:px-0 pb-6 pt-2 w-full max-w-3xl mx-auto">
            <div className="relative">
                {/* Search sources filter */}
                <div className="flex items-center justify-start gap-2 mb-2 px-1">
                    <button
                        onClick={() => onSourceFilterChange('both')}
                        className={`px-3 py-1.5 text-[12px] rounded-full font-medium transition-all ${sourceFilter === 'both'
                            ? 'bg-[#10a37f]/10 text-[#10a37f] dark:bg-[#10a37f]/20'
                            : 'bg-stone-100/50 text-stone-500 hover:bg-stone-200/50 dark:bg-stone-800/50 dark:text-stone-400 dark:hover:bg-stone-800'
                            }`}
                    >
                        📚 Les deux
                    </button>
                    <button
                        onClick={() => onSourceFilterChange('quran')}
                        className={`px-3 py-1.5 text-[12px] rounded-full font-medium transition-all ${sourceFilter === 'quran'
                            ? 'bg-[#10a37f]/10 text-[#10a37f] dark:bg-[#10a37f]/20'
                            : 'bg-stone-100/50 text-stone-500 hover:bg-stone-200/50 dark:bg-stone-800/50 dark:text-stone-400 dark:hover:bg-stone-800'
                            }`}
                    >
                        📖 Coran
                    </button>
                    <button
                        onClick={() => onSourceFilterChange('hadith')}
                        className={`px-3 py-1.5 text-[12px] rounded-full font-medium transition-all ${sourceFilter === 'hadith'
                            ? 'bg-[#10a37f]/10 text-[#10a37f] dark:bg-[#10a37f]/20'
                            : 'bg-stone-100/50 text-stone-500 hover:bg-stone-200/50 dark:bg-stone-800/50 dark:text-stone-400 dark:hover:bg-stone-800'
                            }`}
                    >
                        📜 Hadith
                    </button>
                </div>

                <div
                    className={`flex items-end gap-2 bg-white dark:bg-[#2f2f2f] border border-stone-200/80 dark:border-stone-700/50
                      rounded-[20px] px-4 py-2 shadow-[0_0_15px_rgba(0,0,0,0.02)] dark:shadow-none transition-all duration-200
                      ${isLimitReached ? 'opacity-70 cursor-not-allowed bg-stone-50 dark:bg-[#202123]' : 'focus-within:border-stone-300 dark:focus-within:border-stone-600'}`}
                >
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={e => setValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={
                            isLimitReached
                                ? (resetTime ? `Limite atteinte. Réessayez dans ${resetTime}.` : "Limite de requêtes atteinte. Passez à Premium.")
                                : "Posez une question sur le Coran ou les Hadiths..."
                        }
                        rows={1}
                        disabled={isStreaming || isLimitReached}
                        className="flex-1 resize-none bg-transparent text-[15px] leading-relaxed text-stone-800 dark:text-stone-100
                       placeholder:text-stone-400 dark:placeholder:text-stone-500
                       focus:outline-none py-2 max-h-[200px] disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ minHeight: '44px' }}
                    />

                    {isStreaming ? (
                        // Stop button
                        <button
                            onClick={onStop}
                            className="flex items-center justify-center w-8 h-8 rounded-full mb-1 sm:mb-1.5
                         bg-stone-800 hover:bg-stone-700 dark:bg-stone-200 dark:hover:bg-stone-300 text-white dark:text-stone-900
                         transition-colors active:scale-95 flex-shrink-0"
                            aria-label="Arrêter la génération"
                        >
                            <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                                <rect x="5" y="5" width="14" height="14" rx="2" />
                            </svg>
                        </button>
                    ) : (
                        // Send button
                        <button
                            onClick={handleSubmit}
                            disabled={!canSend}
                            className={`flex items-center justify-center w-8 h-8 rounded-full mb-1 sm:mb-1.5
                         transition-all active:scale-95 flex-shrink-0
                         ${canSend
                                    ? 'bg-stone-800 hover:bg-stone-700 dark:bg-stone-200 dark:hover:bg-stone-300 text-white dark:text-stone-900'
                                    : 'bg-stone-200 dark:bg-stone-700 text-stone-400 dark:text-stone-500 cursor-not-allowed'}`}
                            aria-label="Envoyer"
                        >
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                <line x1="12" y1="19" x2="12" y2="5"></line>
                                <polyline points="5 12 12 5 19 12"></polyline>
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            <p className="text-[11px] text-stone-400 dark:text-stone-500 text-center mt-3">
                L'IA peut commettre des erreurs. Vérifiez toujours les références.
            </p>
        </div>
    )
}
