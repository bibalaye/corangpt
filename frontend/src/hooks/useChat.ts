import { useState, useRef, useCallback, useEffect } from 'react'
import type { Conversation, Message, QuranVerse } from '../types/chat'
import { streamQuestion, fetchHistory } from '../lib/api'
import { useAuth } from './useAuth'

/** Generate a unique ID */
const uid = () => crypto.randomUUID()

/** Time left before the server resets quotas (midnight UTC), e.g. "5h 12m" */
const timeUntilUtcMidnight = (): string => {
    const now = new Date()
    const reset = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
    const ms = reset - now.getTime()
    return `${Math.floor(ms / 3_600_000)}h ${Math.floor((ms % 3_600_000) / 60_000)}m`
}

/** "5h 12m" -> milliseconds (0 when unparseable) */
const parseDuration = (label: string | null): number => {
    const match = label?.match(/(\d+)h\s*(\d+)m/)
    return match ? (Number(match[1]) * 60 + Number(match[2]) + 1) * 60_000 : 0
}

/** Create a blank conversation */
const createConversation = (): Conversation => ({
    id: uid(),
    title: 'Nouveau chat',
    messages: [],
    createdAt: new Date(),
})

export function useChat() {
    const { token } = useAuth();


    const [conversations, setConversations] = useState<Conversation[]>(() => {
        const fresh = createConversation();
        const savedId = sessionStorage.getItem('currentChatId');
        if (savedId && savedId.includes('-')) {
            fresh.id = savedId;
        }
        return [fresh];
    });

    const [currentId, setCurrentId] = useState<string>(
        sessionStorage.getItem('currentChatId') || conversations[0].id
    );

    const isInitialMount = useRef(true);
    const [isStreaming, setIsStreaming] = useState(false);
    const [sourceFilter, setSourceFilter] = useState<'both' | 'quran' | 'hadith'>('both');
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        if (token) {
            fetchHistory().then((historyItems: any[]) => {
                const loadedConvos = historyItems && historyItems.length > 0 ? historyItems.map(item => ({
                    id: item.id.toString(),
                    title: item.query.length > 40 ? item.query.slice(0, 40) + '…' : item.query,
                    createdAt: new Date(item.created_at),
                    messages: [
                        { id: uid(), role: 'user', content: item.query, createdAt: new Date(item.created_at) } as Message,
                        { id: uid(), role: 'assistant', content: item.response, sources: (item.sources || []), createdAt: new Date(item.created_at) } as Message
                    ]
                })) : [];

                setConversations(prev => {
                    const savedId = sessionStorage.getItem('currentChatId');
                    // Find an empty chat if we had one locally
                    const emptyLocals = prev.filter(c => c.messages.length === 0);

                    // See if the saved session ID was an empty chat ID
                    const emptyToKeep = emptyLocals.find(c => c.id === savedId)
                        || (emptyLocals.length > 0 ? emptyLocals[0] : createConversation());

                    if (savedId && savedId === emptyToKeep.id) {
                        emptyToKeep.id = savedId;
                    }

                    const newConvos = [emptyToKeep, ...loadedConvos];

                    if (isInitialMount.current) {
                        if (savedId && newConvos.some(c => c.id === savedId)) {
                            setCurrentId(savedId);
                        } else {
                            setCurrentId(emptyToKeep.id);
                        }
                    } else {
                        // We came here dynamically (login). We put the user on the empty chat.
                        setCurrentId(emptyToKeep.id);
                    }

                    return newConvos;
                });

                isInitialMount.current = false;
            }).catch(e => {
                console.error(e);
                isInitialMount.current = false;
            });
        } else {
            setConversations(prev => {
                const emptyLocals = prev.filter(c => c.messages.length === 0);
                const savedId = sessionStorage.getItem('currentChatId');

                const emptyToKeep = emptyLocals.find(c => c.id === savedId)
                    || (emptyLocals.length > 0 ? emptyLocals[0] : createConversation());

                if (savedId && savedId === emptyToKeep.id) {
                    emptyToKeep.id = savedId;
                    setCurrentId(savedId);
                } else if (!isInitialMount.current) {
                    setCurrentId(emptyToKeep.id);
                } else {
                    setCurrentId(emptyToKeep.id);
                }

                return [emptyToKeep];
            });
            isInitialMount.current = false;
        }
    }, [token]);

    // Update sessionStorage continuously
    useEffect(() => {
        if (currentId) {
            sessionStorage.setItem('currentChatId', currentId);
        }
    }, [currentId]);

    // ── Derived state ──
    // Fallback safe au cas où un bug interviendrait
    const currentConversation = conversations.find(c => c.id === currentId) ?? conversations[0];
    const currentMessages = currentConversation.messages;

    // Quota state comes from the server (single source of truth): set when the
    // API answers "limit_reached", cleared automatically when the quota resets.
    const [isLimitReached, setIsLimitReached] = useState(false);
    const [nextResetTime, setNextResetTime] = useState<string | null>(null);

    const markLimitReached = useCallback((resetTime?: string | null) => {
        const label = resetTime || timeUntilUtcMidnight()
        setIsLimitReached(true)
        setNextResetTime(label)
        document.dispatchEvent(new CustomEvent('open-limit-modal', { detail: { resetTime: label } }))
    }, [])

    useEffect(() => {
        if (!isLimitReached) return
        const timer = setTimeout(() => {
            setIsLimitReached(false)
            setNextResetTime(null)
        }, parseDuration(nextResetTime) || 60 * 60 * 1000)
        return () => clearTimeout(timer)
    }, [isLimitReached, nextResetTime])

    // ── Helpers to update messages in the current conversation ──
    const updateMessages = useCallback(
        (updater: (msgs: Message[]) => Message[]) => {
            setConversations(prev =>
                prev.map(c =>
                    c.id === currentId ? { ...c, messages: updater(c.messages) } : c
                )
            )
        },
        [currentId]
    )

    const updateConversationTitle = useCallback(
        (title: string) => {
            setConversations(prev =>
                prev.map(c => (c.id === currentId ? { ...c, title } : c))
            )
        },
        [currentId]
    )

    // ── Actions ──

    /** Start a new conversation */
    const newChat = useCallback(() => {
        setConversations(prev => {
            const emptyChat = prev.find(c => c.messages.length === 0);
            if (emptyChat) {
                setCurrentId(emptyChat.id);
                return prev;
            }
            const conv = createConversation();
            setCurrentId(conv.id);
            return [conv, ...prev];
        });
    }, [])

    /** Switch to an existing conversation */
    const selectConversation = useCallback((id: string) => {
        setCurrentId(id)
    }, [])

    /** Delete a conversation */
    const deleteConversation = useCallback(
        (id: string) => {
            setConversations(prev => {
                const remaining = prev.filter(c => c.id !== id)
                if (remaining.length === 0) {
                    const fresh = createConversation()
                    setCurrentId(fresh.id)
                    return [fresh]
                }
                if (id === currentId) {
                    setCurrentId(remaining[0].id)
                }
                return remaining
            })
        },
        [currentId]
    )

    /** Stop the current streaming generation */
    const stopGeneration = useCallback(() => {
        abortRef.current?.abort()
        abortRef.current = null
        setIsStreaming(false)
        // Mark the streaming message as complete
        updateMessages(msgs =>
            msgs.map(m => (m.isStreaming ? { ...m, isStreaming: false } : m))
        )
    }, [updateMessages])

    /** Send a message and stream the response */
    const sendMessage = useCallback(
        async (content: string) => {
            const question = content.trim()
            if (isStreaming || !question) return

            if (!localStorage.getItem('token')) {
                document.dispatchEvent(new CustomEvent('open-auth-modal'))
                return
            }

            const userMsg: Message = { id: uid(), role: 'user', content: question, createdAt: new Date() }
            const assistantMsg: Message = { id: uid(), role: 'assistant', content: '', isStreaming: true, createdAt: new Date() }
            const patchAssistant = (patch: (m: Message) => Partial<Message>) =>
                updateMessages(msgs => msgs.map(m => (m.id === assistantMsg.id ? { ...m, ...patch(m) } : m)))
            const removeOptimistic = () =>
                updateMessages(msgs => msgs.filter(m => m.id !== assistantMsg.id && m.id !== userMsg.id))

            updateMessages(msgs => [...msgs, userMsg, assistantMsg])
            if (currentMessages.length === 0) {
                updateConversationTitle(question.length > 40 ? question.slice(0, 40) + '…' : question)
            }

            // Tokens arrive far faster than the screen refreshes: buffer them and
            // apply at most one state update (and one Markdown render) per frame.
            let pending = ''
            let frame = 0
            const flush = () => {
                cancelAnimationFrame(frame)
                frame = 0
                if (!pending) return
                const chunk = pending
                pending = ''
                patchAssistant(m => ({ content: m.content + chunk }))
            }

            const controller = new AbortController()
            abortRef.current = controller
            setIsStreaming(true)

            try {
                await streamQuestion(
                    question,
                    sourceFilter,
                    {
                        onSources: (sources: QuranVerse[]) => patchAssistant(() => ({ sources })),
                        onToken: (token: string) => {
                            pending += token
                            if (!frame) frame = requestAnimationFrame(flush)
                        },
                        onDone: () => {
                            flush()
                            patchAssistant(() => ({ isStreaming: false }))
                        },
                        onError: (error: string, errorCode?: string, resetTime?: string) => {
                            flush()
                            if (errorCode === 'limit_reached') {
                                removeOptimistic()
                                markLimitReached(resetTime)
                            } else {
                                patchAssistant(m => ({
                                    content: m.content ? `${m.content}\n\n*${error}*` : error,
                                    isStreaming: false,
                                }))
                            }
                        },
                    },
                    controller.signal
                )
            } catch (err: any) {
                flush()
                if (err.name === 'AbortError') return
                if (err.status === 403) {
                    removeOptimistic()
                    markLimitReached(err.resetTime)
                } else {
                    patchAssistant(() => ({
                        content: err.message || 'Désolé, une erreur est survenue.',
                        isStreaming: false,
                    }))
                }
            } finally {
                flush()
                setIsStreaming(false)
                abortRef.current = null
            }
        },
        [isStreaming, currentMessages.length, sourceFilter, updateMessages, updateConversationTitle, markLimitReached]
    )

    return {
        conversations,
        currentConversation,
        currentMessages,
        currentId,
        isStreaming,
        isLimitReached,
        nextResetTime,
        sourceFilter,
        setSourceFilter,
        newChat,
        sendMessage,
        selectConversation,
        deleteConversation,
        stopGeneration,
    }
}
