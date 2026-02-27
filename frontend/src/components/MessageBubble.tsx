import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Message } from '../types/chat'
import { QuranVerse } from './QuranVerse'
import { useAudioSettings } from '../hooks/useAudioSettings'

interface MessageBubbleProps {
    message: Message
}

/**
 * Individual message bubble — user or assistant.
 *
 * Assistant messages render markdown with prose styling.
 * Shows a streaming cursor when content is still being generated.
 * Displays Quran verse sources below the response.
 */
export function MessageBubble({ message }: MessageBubbleProps) {
    const isUser = message.role === 'user'
    const { autoPlay } = useAudioSettings()
    const [isSpeaking, setIsSpeaking] = useState(false)

    useEffect(() => {
        return () => {
            if (isSpeaking) {
                window.speechSynthesis.cancel();
            }
        };
    }, [isSpeaking]);

    const toggleSpeech = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        } else {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(message.content);
            utterance.lang = 'fr-FR';
            utterance.rate = 1.0;
            utterance.pitch = 1.0;

            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);

            window.speechSynthesis.speak(utterance);
            setIsSpeaking(true);
        }
    };

    return (
        <div className={`animate-fade-in-up ${isUser ? '' : 'bg-cream-100/50 dark:bg-stone-900/50 -mx-4 md:-mx-6 px-4 md:px-6 rounded-2xl'} py-5`}>
            <div className="flex gap-3.5 items-start">
                {/* Avatar */}
                <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs mt-0.5
            ${isUser
                            ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white'
                            : 'bg-gradient-to-br from-amber-700 to-amber-900 text-amber-100'
                        }`}
                >
                    {isUser ? '👤' : '📖'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Role label + TTS Action */}
                    <div className="flex items-center justify-between mb-1.5">
                        <div className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                            {isUser ? 'Vous' : 'IA Coran'}
                        </div>

                        {!isUser && !message.isStreaming && message.content && (
                            <button
                                onClick={toggleSpeech}
                                className="text-xs flex items-center gap-1.5 px-2 py-1 rounded text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition-colors"
                                title="Écouter l'explication"
                            >
                                {isSpeaking ? (
                                    <>
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>Stop</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M17.657 6.343a8 8 0 010 11.314M10.5 20.25L4.5 15.75H2.25V8.25H4.5l6-4.5v16.5z" />
                                        </svg>
                                        <span>Écouter</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {isUser ? (
                        // User message — plain text
                        <p className="text-[0.95rem] leading-relaxed text-stone-800 dark:text-stone-200">
                            {message.content}
                        </p>
                    ) : (
                        // Assistant message — markdown rendered
                        <div className="prose-chat text-[0.95rem] text-stone-800 dark:text-stone-200">
                            {message.content ? (
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {message.content}
                                </ReactMarkdown>
                            ) : message.isStreaming ? (
                                // Loading skeleton
                                <div className="space-y-2.5 animate-pulse">
                                    <div className="h-3.5 bg-stone-200 dark:bg-stone-700 rounded w-3/4" />
                                    <div className="h-3.5 bg-stone-200 dark:bg-stone-700 rounded w-1/2" />
                                    <div className="h-3.5 bg-stone-200 dark:bg-stone-700 rounded w-5/6" />
                                </div>
                            ) : null}

                            {/* Streaming cursor */}
                            {message.isStreaming && message.content && (
                                <span className="inline-block w-2 h-5 bg-amber-600/70 dark:bg-amber-400/70 rounded-sm ml-0.5 animate-cursor-blink align-text-bottom" />
                            )}
                        </div>
                    )}

                    {/* Quran verse sources */}
                    {message.sources && message.sources.length > 0 && !message.isStreaming && (
                        <div className="mt-4 space-y-3">
                            <p className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                                Sources coraniques
                            </p>
                            {message.sources.map((src, i) => (
                                <QuranVerse
                                    key={i}
                                    verse={src}
                                    autoPlayTrigger={autoPlay && i === 0}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
