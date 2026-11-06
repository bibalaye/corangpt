import { useState, useRef, useCallback, useEffect } from 'react'
import type { Conversation, Message, QuranVerse } from '../types/chat'
import { streamQuestion, fetchHistory, deleteHistory } from '../lib/api'
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
    title: 'Nouvelle question',
    messages: [],
    createdAt: new Date(),
})

export function useChat() {
    const { token } = useAuth();


    const [conversations, setConversations] = useState<Conversation[]>(() => [createConversation()])
    const [currentId, setCurrentId] = useState<string>(
        () => sessionStorage.getItem('currentChatId') || conversations[0].id
    )
    // Latest list, read by the history loader without putting side effects in a state updater
    const conversationsRef = useRef(conversations)
    conversationsRef.current = conversations

    const isInitialMount = useRef(true);
    const [isStreaming, setIsStreaming] = useState(false);
    const [sourceFilter, setSourceFilter] = useState<'both' | 'quran' | 'hadith'>('both');
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        // Ignore a response that belongs to a previous run (token change, StrictMode re-run)
        let cancelled = false
        const draft = () => conversationsRef.current.find(c => c.messages.length === 0) ?? createConversation()

        if (!token) {
            const empty = draft()
            setConversations([empty])
            setCurrentId(empty.id)
            isInitialMount.current = false
            return () => { cancelled = true }
        }

        fetchHistory().then((historyItems: any[]) => {
            if (cancelled) return
            const loaded: Conversation[] = (historyItems ?? []).map(item => ({
                id: item.id.toString(),
                title: item.query.length > 40 ? item.query.slice(0, 40) + '…' : item.query,
                createdAt: new Date(item.created_at),
                messages: [
                    { id: uid(), role: 'user', content: item.query, createdAt: new Date(item.created_at) },
                    { id: uid(), role: 'assistant', content: item.response, sources: item.sources || [], serverId: item.id, createdAt: new Date(item.created_at) },
                ],
            }))
            const empty = draft()
            const next = [empty, ...loaded]
            // On reload, reopen the conversation that was on screen; after a fresh login, start blank
            const savedId = sessionStorage.getItem('currentChatId')
            const restore = isInitialMount.current && savedId && next.some(c => c.id === savedId)
            isInitialMount.current = false
            setConversations(next)
            setCurrentId(restore ? savedId! : empty.id)
        }).catch(e => {
            if (cancelled) return
            console.error(e)
            isInitialMount.current = false
        })
        return () => { cancelled = true }
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
        const empty = conversationsRef.current.find(c => c.messages.length === 0)
        if (empty) {
            setCurrentId(empty.id)
            return
        }
        const conv = createConversation()
        setConversations(prev => [conv, ...prev])
        setCurrentId(conv.id)
    }, [])

    /** Switch to an existing conversation */
    const selectConversation = useCallback((id: string) => {
        setCurrentId(id)
    }, [])

    /** Delete a conversation — on the server too, so it does not come back on reload */
    const deleteConversation = useCallback(
        (id: string) => {
            const list = conversationsRef.current
            const target = list.find(c => c.id === id)
            if (!target) return
            const index = list.indexOf(target)
            const serverIds = new Set<number>(
                target.messages.map(m => m.serverId).filter((n): n is number => typeof n === 'number')
            )
            if (/^\d+$/.test(id)) serverIds.add(Number(id))

            const remaining = list.filter(c => c.id !== id)
            const next = remaining.length > 0 ? remaining : [createConversation()]
            setConversations(next)
            if (id === currentId || remaining.length === 0) setCurrentId(next[0].id)

            if (serverIds.size > 0) {
                Promise.all([...serverIds].map(deleteHistory)).catch(() => {
                    // Put it back where it was: the user must not believe it is gone
                    setConversations(cur => cur.some(c => c.id === id) ? cur : [...cur.slice(0, index), target, ...cur.slice(index)])
                })
            }
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
                        onDone: (historyId?: number) => {
                            flush()
                            patchAssistant(() => ({ isStreaming: false, serverId: historyId }))
                        },
                        onError: (error: string, errorCode?: string, resetTime?: string) => {
                            flush()
                            if (errorCode === 'limit_reached') {
                                removeOptimistic()
                                markLimitReached(resetTime)
                            } else {
                                patchAssistant(() => ({ error, isStreaming: false }))
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
                    const offline = typeof navigator !== 'undefined' && navigator.onLine === false
                    patchAssistant(() => ({
                        error: offline ? 'Pas de connexion. Vérifiez votre réseau puis réessayez.' : (err.message || 'Une erreur est survenue.'),
                        isStreaming: false,
                    }))
                }
            } finally {
                flush()
                // The stream can end without "done" (connection cut): never leave the answer spinning
                patchAssistant(m => (m.isStreaming
                    ? { isStreaming: false, error: m.error ?? (m.content ? undefined : 'La réponse a été interrompue. Vérifiez votre connexion puis réessayez.') }
                    : {}))
                setIsStreaming(false)
                abortRef.current = null
            }
        },
        [isStreaming, currentMessages.length, sourceFilter, updateMessages, updateConversationTitle, markLimitReached]
    )

    /** Re-ask the question whose answer failed */
    const retryLast = useCallback(() => {
        const msgs = currentMessages
        const failedIndex = msgs.length - 1
        if (failedIndex < 1 || !msgs[failedIndex].error || msgs[failedIndex - 1].role !== 'user') return
        const question = msgs[failedIndex - 1].content
        const failedIds = new Set([msgs[failedIndex].id, msgs[failedIndex - 1].id])
        updateMessages(list => list.filter(m => !failedIds.has(m.id)))
        // Let the removal land before the optimistic pair of the retry is added
        setTimeout(() => sendMessage(question), 0)
    }, [currentMessages, updateMessages, sendMessage])

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
        retryLast,
    }
}
