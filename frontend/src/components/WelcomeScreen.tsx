interface WelcomeScreenProps {
    onSuggestion: (question: string) => void
}

const SUGGESTIONS = [
    'Que dit le Coran sur la patience ?',
    'Parle-moi de la création de l\'univers.',
    'Quels sont les droits des parents ?',
    'Bienfaits de la prière de nuit.',
]

/**
 * Welcome screen shown when no messages exist.
 * Displays a greeting and clickable suggestion cards.
 */
export function WelcomeScreen({ onSuggestion }: WelcomeScreenProps) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 mt-10 md:mt-0">
            <div className="max-w-xl text-center animate-fade-in-up w-full">
                {/* Icon */}
                <div className="mb-6 flex justify-center">
                    <div className="flex items-center justify-center w-14 h-14 rounded-full bg-stone-100 dark:bg-[#2f2f2f] shadow-sm">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-700 dark:text-stone-300">
                            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
                        </svg>
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-[28px] font-semibold text-stone-900 dark:text-gray-100 mb-2 tracking-tight">
                    Comment puis-je vous aider aujourd'hui ?
                </h2>

                {/* Subtitle */}
                <p className="text-stone-500 dark:text-stone-400 text-[15px] mb-10 max-w-sm mx-auto">
                    Posez vos questions sur le Saint Coran. Les réponses s'appuient sur les versets et Hadiths authentiques.
                </p>

                {/* Suggestion grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                    {SUGGESTIONS.map((text, i) => (
                        <button
                            key={i}
                            onClick={() => onSuggestion(text)}
                            className="text-left px-5 py-3.5 rounded-xl
                         bg-white dark:bg-[#2f2f2f] border border-stone-200 dark:border-stone-700/60
                         text-[14px] text-stone-600 dark:text-gray-300
                         hover:bg-stone-50 dark:hover:bg-[#343541]
                         transition-all duration-200 shadow-[0_0_15px_rgba(0,0,0,0.01)] dark:shadow-none"
                        >
                            <span className="line-clamp-2">{text}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
