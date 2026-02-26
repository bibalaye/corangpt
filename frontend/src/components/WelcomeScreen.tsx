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
        <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-lg text-center animate-fade-in-up">
                {/* Icon */}
                <div className="text-5xl mb-5 animate-gentle-float">📖</div>

                {/* Title */}
                <h2 className="text-2xl font-semibold text-stone-800 dark:text-stone-100 mb-3 tracking-tight">
                    Bienvenue sur IA Coran
                </h2>

                {/* Subtitle */}
                <p className="text-stone-500 dark:text-stone-400 text-[0.95rem] leading-relaxed mb-8 max-w-sm mx-auto">
                    Posez vos questions sur le Saint Coran. L'IA répondra en s'appuyant sur les versets authentiques.
                </p>

                {/* Suggestion grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {SUGGESTIONS.map((text, i) => (
                        <button
                            key={i}
                            onClick={() => onSuggestion(text)}
                            className="group relative text-left px-4 py-3.5 rounded-xl
                         bg-cream-100/70 dark:bg-stone-800/60
                         border border-cream-300/60 dark:border-stone-700/60
                         text-sm text-stone-600 dark:text-stone-400
                         hover:bg-white dark:hover:bg-stone-800
                         hover:border-amber-300/60 dark:hover:border-amber-700/40
                         hover:text-stone-800 dark:hover:text-stone-200
                         hover:shadow-md hover:-translate-y-0.5
                         transition-all duration-200 active:scale-[0.98]"
                        >
                            {text}
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-amber-600 dark:text-amber-400 transition-opacity text-xs">
                                →
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
