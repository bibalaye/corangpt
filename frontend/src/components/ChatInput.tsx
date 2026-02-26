import { useState, useRef, useEffect, useCallback } from 'react'

interface ChatInputProps {
    onSend: (content: string) => void
    onStop: () => void
    isStreaming: boolean
}

/**
 * Chat input with auto-resizing textarea, send/stop buttons.
 * Handles Enter to send, Shift+Enter for new line.
 */
export function ChatInput({ onSend, onStop, isStreaming }: ChatInputProps) {
    const [value, setValue] = useState('')
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const canSend = value.trim().length > 0 && !isStreaming

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
        <div className="px-4 md:px-0 pb-4 pt-2">
            <div className="max-w-3xl mx-auto">
                <div
                    className="flex items-end gap-2 bg-white dark:bg-stone-900 border border-cream-300 dark:border-stone-700
                      rounded-2xl px-4 py-2 shadow-sm
                      focus-within:border-amber-400/60 dark:focus-within:border-amber-600/40
                      focus-within:shadow-[0_0_0_1px_rgba(196,132,62,0.15)] transition-all duration-200"
                >
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={e => setValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Posez votre question sur le Coran..."
                        rows={1}
                        disabled={isStreaming}
                        className="flex-1 resize-none bg-transparent text-[0.93rem] text-stone-800 dark:text-stone-200
                       placeholder:text-stone-400 dark:placeholder:text-stone-600
                       focus:outline-none py-2 max-h-[200px] disabled:opacity-50"
                    />

                    {isStreaming ? (
                        // Stop button
                        <button
                            onClick={onStop}
                            className="flex items-center justify-center w-9 h-9 rounded-full mb-0.5
                         bg-red-500 hover:bg-red-600 text-white
                         transition-all duration-150 active:scale-95 flex-shrink-0"
                            aria-label="Arrêter la génération"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <rect x="6" y="6" width="12" height="12" rx="2" />
                            </svg>
                        </button>
                    ) : (
                        // Send button
                        <button
                            onClick={handleSubmit}
                            disabled={!canSend}
                            className="flex items-center justify-center w-9 h-9 rounded-full mb-0.5
                         bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900
                         hover:bg-amber-700 dark:hover:bg-amber-300
                         disabled:opacity-20 disabled:cursor-not-allowed
                         transition-all duration-150 active:scale-95 flex-shrink-0"
                            aria-label="Envoyer"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                            </svg>
                        </button>
                    )}
                </div>

                <p className="text-[0.7rem] text-stone-400 dark:text-stone-600 text-center mt-2.5">
                    L'IA peut commettre des erreurs. Vérifiez toujours les références coraniques.
                </p>
            </div>
        </div>
    )
}
