import { useState, useRef, useEffect } from 'react'
import type { QuranVerse as QuranVerseType } from '../types/chat'

interface QuranVerseProps {
    verse: QuranVerseType
    autoPlayTrigger?: boolean
}

/**
 * Styled Quran verse citation block.
 * Displays Arabic text (RTL), French translation, and reference badge.
 * Includes audio playback for the verse.
 */
export function QuranVerse({ verse, autoPlayTrigger }: QuranVerseProps) {
    const isHadith = verse.source_type === 'Hadith'
    const isQuran = !isHadith

    const [isPlaying, setIsPlaying] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    // Extract Surah and Ayah numbers for the audio URL (Quran only)
    let surah = verse.metadata?.sourate;
    let ayah = verse.metadata?.ayah;

    if (isQuran && !surah && !ayah) {
        // Fallback: extract from reference string like "Sourate 2:185"
        const match = verse.reference.match(/(\d+)[:\s-]*(\d+)/);
        if (match) {
            surah = parseInt(match[1], 10);
            ayah = parseInt(match[2], 10);
        }
    }

    // Generate EveryAyah API URL for Mishary Alafasy (128kbps) - Quran only
    const audioUrl = isQuran && surah && ayah
        ? `https://everyayah.com/data/Alafasy_128kbps/${surah.toString().padStart(3, '0')}${ayah.toString().padStart(3, '0')}.mp3`
        : null;

    useEffect(() => {
        // Cleanup audio on unmount
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        }
    }, [])

    useEffect(() => {
        if (autoPlayTrigger && !isPlaying && !isLoading && audioUrl) {
            if (!audioRef.current) {
                audioRef.current = new Audio(audioUrl);
                audioRef.current.onplaying = () => {
                    setIsLoading(false);
                    setIsPlaying(true);
                };
                audioRef.current.onpause = () => setIsPlaying(false);
                audioRef.current.onended = () => setIsPlaying(false);
                audioRef.current.onerror = () => {
                    setIsLoading(false);
                    setIsPlaying(false);
                    console.error("Erreur de chargement de l'audio");
                };
            }

            if (audioRef.current.paused) {
                setIsLoading(true);
                audioRef.current.play().catch(e => {
                    console.error(e);
                    setIsLoading(false);
                });
            }
        }
    }, [autoPlayTrigger, audioUrl])

    const toggleAudio = () => {
        if (!audioUrl) return;

        if (!audioRef.current) {
            audioRef.current = new Audio(audioUrl);
            audioRef.current.onplaying = () => {
                setIsLoading(false);
                setIsPlaying(true);
            };
            audioRef.current.onpause = () => setIsPlaying(false);
            audioRef.current.onended = () => setIsPlaying(false);
            audioRef.current.onerror = () => {
                setIsLoading(false);
                setIsPlaying(false);
                console.error("Erreur de chargement de l'audio");
            };
        }

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            setIsLoading(true);
            audioRef.current.play().catch(e => {
                console.error(e);
                setIsLoading(false);
            });
        }
    };

    return (
        <div className={`quran-verse-block animate-fade-in-up border-l-4 pl-4 py-2 ${isQuran ? 'border-green-500' : 'border-blue-500'} dark:${isQuran ? 'border-green-600' : 'border-blue-600'} bg-white/50 dark:bg-stone-900/50 rounded-r-lg shadow-sm mb-3`}>
            {/* Header: source icon + reference */}
            <div className="flex items-center gap-2 mb-3">
                {isQuran ? (
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400">
                        📖
                    </span>
                ) : (
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                        📜
                    </span>
                )}
                <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-sm ${isQuran ? 'text-green-700 dark:text-green-400' : 'text-blue-700 dark:text-blue-400'}`}>
                    {verse.reference}
                </span>
            </div>

            {/* Arabic text */}
            <p className="font-arabic text-xl leading-loose text-stone-800 dark:text-stone-200 text-right mb-3" dir="rtl">
                {verse.text_ar}
            </p>

            {/* French translation */}
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed italic mb-3">
                {verse.text_fr}
            </p>

            {/* Bottom Row: Audio Button (Quran only) */}
            <div className="flex items-center justify-end mt-1">
                {/* Audio Button */}
                {audioUrl && (
                    <button
                        onClick={toggleAudio}
                        disabled={isLoading}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer
                            ${isPlaying
                                ? 'bg-green-500 text-white shadow-md'
                                : 'bg-stone-100 dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700'
                            }
                            ${isLoading ? 'opacity-80 cursor-wait' : ''}
                        `}
                        title="Écouter la récitation (Mishary Alafasy)"
                    >
                        {isLoading ? (
                            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : isPlaying ? (
                            <>
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                                </svg>
                                <span>Pause</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                                <span>Écouter</span>
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    )
}
