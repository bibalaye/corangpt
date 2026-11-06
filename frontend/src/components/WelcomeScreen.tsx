import { ChevronRight } from 'lucide-react'

interface WelcomeScreenProps {
    onSuggestion: (question: string) => void
}

const SUGGESTIONS = [
    'Que dit le Coran sur la patience dans les épreuves ?',
    'Quels sont les droits des parents ?',
    'Quels sont les bienfaits de la prière de nuit ?',
    'Comment le Coran décrit-il la création de l’univers ?',
]

/**
 * Empty conversation. Everything sits at the bottom, just above the question
 * field, so the first tap is in thumb reach.
 */
export function WelcomeScreen({ onSuggestion }: WelcomeScreenProps) {
    return (
        <section aria-labelledby="welcome-title" className="flex flex-1 flex-col justify-end px-4 pb-4 pt-10">
            <h1 id="welcome-title" className="px-1">
                <span lang="ar" dir="rtl" className="block text-left font-arabic text-[2.75rem] leading-[1.35] text-ink">
                    السَّلَامُ عَلَيْكُمْ
                </span>
                <span className="mt-1 block text-[1.375rem] font-semibold leading-snug tracking-[-0.01em] text-ink">
                    Que la paix soit sur vous.
                </span>
            </h1>
            <p className="reading mt-3 max-w-[34rem] px-1 text-ink-2">
                Posez votre question. Chaque réponse cite les versets du Coran et les hadiths de Sahih al-Bukhari sur lesquels elle s’appuie, à lire et à écouter.
            </p>

            <h2 className="sr-only">Exemples de questions</h2>
            <ul className="mt-6 divide-y divide-line overflow-hidden rounded-2xl bg-surface">
                {SUGGESTIONS.map(text => (
                    <li key={text}>
                        <button
                            type="button"
                            onClick={() => onSuggestion(text)}
                            className="press flex min-h-14 w-full items-center gap-3 py-3 pl-4 pr-3 text-left active:bg-sunk hover:bg-sunk/60"
                        >
                            <span className="flex-1 text-[1rem] leading-snug text-ink">{text}</span>
                            <ChevronRight aria-hidden="true" size={18} className="shrink-0 text-ink-3" />
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    )
}
