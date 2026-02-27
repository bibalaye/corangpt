import { useState, useRef, useCallback, useEffect } from 'react'
import type { Conversation, Message, QuranVerse } from '../types/chat'
import { streamQuestion, fetchHistory } from '../lib/api'
import { useAuth } from './useAuth'

/** Generate a unique ID */
const uid = () => crypto.randomUUID()

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

    const [isLimitReached, setIsLimitReached] = useState(false);
    const [nextResetTime, setNextResetTime] = useState<string | null>(null);

    useEffect(() => {
        const checkLimit = () => {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    // Check if last_request_date is essentially today
                    // Si date change on the server, requests_today gets reset. 
                    // Si on a un limit > 0 et que notre compte en memoire est saturé : 
                    if (user.profile && user.profile.daily_request_limit > 0 && user.profile.requests_today >= user.profile.daily_request_limit) {

                        // Local fallback calculation for reset (midnight tonight)
                        let timeStr = "";
                        try {
                            const now = new Date();
                            const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                            tomorrow.setHours(0, 0, 0, 0); // reset at midnight local time
                            const msDiff = tomorrow.getTime() - now.getTime();
                            const hoursLeft = Math.floor(msDiff / (1000 * 60 * 60));
                            const minsLeft = Math.floor((msDiff % (1000 * 60 * 60)) / (1000 * 60));
                            timeStr = `${hoursLeft}h ${minsLeft}m`;
                        } catch (e) { }

                        setIsLimitReached(true);
                        setNextResetTime(timeStr);
                        return;
                    }
                } catch (e) { }
            }
            setIsLimitReached(false);
            setNextResetTime(null);
        };

        checkLimit();
        // Optionnel : Re-vérifier quand les événements surviennent
        window.addEventListener('storage', checkLimit);

        // Timer effect if limit reached
        let interval: ReturnType<typeof setInterval>;
        if (isLimitReached) {
            interval = setInterval(checkLimit, 60000); // refresh every minute
        }

        return () => {
            window.removeEventListener('storage', checkLimit);
            if (interval) clearInterval(interval);
        }
    }, [currentMessages.length, isLimitReached]); // Re-vérifier après chaque message (la valeur locale de requests_today y est incrementée)

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
            if (isStreaming || !content.trim()) return

            const token = localStorage.getItem('token');
            if (!token) {
                document.dispatchEvent(new CustomEvent('open-auth-modal'));
                return;
            }

            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    if (user.profile && user.profile.daily_request_limit > 0 && user.profile.requests_today >= user.profile.daily_request_limit) {
                        // Let's attempt to calculate reset time
                        let timeStr = "";
                        try {
                            const now = new Date();
                            const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                            tomorrow.setHours(0, 0, 0, 0);
                            const msDiff = tomorrow.getTime() - now.getTime();
                            const hoursLeft = Math.floor(msDiff / (1000 * 60 * 60));
                            const minsLeft = Math.floor((msDiff % (1000 * 60 * 60)) / (1000 * 60));
                            timeStr = `${hoursLeft}h ${minsLeft}m`;
                        } catch (e) { }

                        document.dispatchEvent(new CustomEvent('open-limit-modal', { detail: { resetTime: timeStr } }));
                        return;
                    }
                } catch (e) { }
            }

            const userMsg: Message = {
                id: uid(),
                role: 'user',
                content: content.trim(),
                createdAt: new Date(),
            }

            const assistantMsg: Message = {
                id: uid(),
                role: 'assistant',
                content: '',
                isStreaming: true,
                createdAt: new Date(),
            }

            // Add both messages
            updateMessages(msgs => [...msgs, userMsg, assistantMsg])

            // Set conversation title from first question
            if (currentMessages.length === 0) {
                const title =
                    content.trim().length > 40
                        ? content.trim().slice(0, 40) + '…'
                        : content.trim()
                updateConversationTitle(title)
            }

            // Start streaming
            const controller = new AbortController()
            abortRef.current = controller
            setIsStreaming(true)

            try {
                await streamQuestion(
                    content.trim(),
                    sourceFilter,
                    {
                        onSources: (sources: QuranVerse[]) => {
                            updateMessages(msgs =>
                                msgs.map(m =>
                                    m.id === assistantMsg.id ? { ...m, sources } : m
                                )
                            )
                        },
                        onToken: (token: string) => {
                            updateMessages(msgs =>
                                msgs.map(m =>
                                    m.id === assistantMsg.id
                                        ? { ...m, content: m.content + token }
                                        : m
                                )
                            )
                        },
                        onDone: () => {
                            updateMessages(msgs =>
                                msgs.map(m =>
                                    m.id === assistantMsg.id
                                        ? { ...m, isStreaming: false }
                                        : m
                                )
                            )

                            // On success, we also update the user requests_today state in local storage to keep sync
                            const userStr = localStorage.getItem('user');
                            if (userStr) {
                                try {
                                    const user = JSON.parse(userStr);
                                    if (user.profile) {
                                        user.profile.requests_today = (user.profile.requests_today || 0) + 1;
                                        localStorage.setItem('user', JSON.stringify(user));
                                    }
                                } catch (e) { }
                            }
                        },
                        onError: (error: string, errorCode?: string, serverResetTime?: string) => {
                            if (errorCode === 'limit_reached' || error.includes('Limite de requêtes') || error.includes('403')) {
                                document.dispatchEvent(new CustomEvent('open-limit-modal', { detail: { resetTime: serverResetTime || nextResetTime || "demain" } }));
                                // Remove the optimistic messages
                                updateMessages(msgs => msgs.filter(m => m.id !== assistantMsg.id && m.id !== userMsg.id));
                                setIsLimitReached(true)
                                if (serverResetTime) setNextResetTime(serverResetTime)
                            } else {
                                updateMessages(msgs =>
                                    msgs.map(m =>
                                        m.id === assistantMsg.id
                                            ? {
                                                ...m,
                                                content: `Erreur: ${error}`,
                                                isStreaming: false,
                                            }
                                            : m
                                    )
                                )
                            }
                        },
                    },
                    controller.signal
                )
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    if (err.resetTime) {
                        setNextResetTime(err.resetTime);
                    }
                    if (err.message && (err.message.includes('Limite de requêtes') || err.message.includes('403'))) {
                        document.dispatchEvent(new CustomEvent('open-limit-modal', { detail: { resetTime: err.resetTime || nextResetTime || "demain" } }));
                        updateMessages(msgs => msgs.filter(m => m.id !== assistantMsg.id && m.id !== userMsg.id));
                        setIsLimitReached(true)
                    } else {
                        updateMessages(msgs =>
                            msgs.map(m =>
                                m.id === assistantMsg.id
                                    ? {
                                        ...m,
                                        content: err.message || 'Désolé, une erreur est survenue.',
                                        isStreaming: false,
                                    }
                                    : m
                            )
                        )
                    }
                }
            } finally {
                setIsStreaming(false)
                abortRef.current = null
            }
        },
        [isStreaming, currentMessages.length, sourceFilter, updateMessages, updateConversationTitle]
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
