import type { QuranVerse as QuranVerseType } from '../types/chat'

interface QuranVerseProps {
    verse: QuranVerseType
}

/**
 * Styled Quran verse citation block.
 * Displays Arabic text (RTL), French translation, and reference badge.
 */
export function QuranVerse({ verse }: QuranVerseProps) {
    return (
        <div className="quran-verse-block animate-fade-in-up">
            {/* Arabic text */}
            <p className="font-arabic text-xl leading-loose text-stone-800 dark:text-stone-200 text-right mb-3" dir="rtl">
                {verse.text_ar}
            </p>

            {/* French translation */}
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed italic mb-2">
                {verse.text_fr}
            </p>

            {/* Reference badge */}
            <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100/80 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                {verse.reference}
            </span>
        </div>
    )
}
