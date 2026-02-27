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
        <div className={`flex w-full animate-fade-in-up ${isUser ? 'justify-end py-3' : 'justify-start py-5'}`}>
            {isUser ? (
                // ── USER MESSAGE ──
                <div className="bg-[#f4f4f4] dark:bg-[#2f2f2f] text-stone-900 dark:text-gray-100 px-5 py-2.5 rounded-3xl max-w-[85%] md:max-w-[75%] text-[15px] leading-relaxed">
                    {message.content}
                </div>
            ) : (
                // ── ASSISTANT MESSAGE ──
                <div className="flex gap-4 w-full max-w-3xl mx-auto px-4 md:px-0">
                    {/* Avatar */}
                    <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-[#10a37f]/10 mt-1 shadow-sm">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#10a37f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                        </svg>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {/* TTS Action Header */}
                        {!message.isStreaming && message.content && (
                            <div className="flex justify-end mb-1">
                                <button
                                    onClick={toggleSpeech}
                                    className="text-[13px] flex items-center gap-1.5 px-2 py-1 rounded text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
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
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Markdown Content */}
                        <div className="prose-chat text-[15px] leading-[1.6] text-stone-800 dark:text-gray-200">
                            {message.content ? (
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {message.content}
                                </ReactMarkdown>
                            ) : message.isStreaming ? (
                                // Loading skeleton
                                <div className="space-y-3 animate-pulse">
                                    <div className="h-3 bg-stone-200 dark:bg-[#2f2f2f] rounded w-3/4" />
                                    <div className="h-3 bg-stone-200 dark:bg-[#2f2f2f] rounded w-1/2" />
                                    <div className="h-3 bg-stone-200 dark:bg-[#2f2f2f] rounded w-5/6" />
                                </div>
                            ) : null}

                            {/* Streaming cursor */}
                            {message.isStreaming && message.content && (
                                <span className="inline-block w-2.5 h-4 bg-stone-400 dark:bg-stone-500 rounded-sm ml-1 animate-pulse align-middle" />
                            )}
                        </div>

                        {/* Sources */}
                        {message.sources && message.sources.length > 0 && !message.isStreaming && (
                            <div className="mt-5 space-y-3">
                                <p className="text-[12px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-1.5">
                                    Sources
                                </p>
                                {message.sources.map((src, i) => (
                                    <QuranVerse
                                        key={i}
                                        verse={src}
                                        autoPlayTrigger={autoPlay && i === 0 && src.source_type !== 'Hadith'}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
