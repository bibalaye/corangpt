import { useState, useRef, useCallback } from 'react'
import type { Conversation, Message, QuranVerse } from '../types/chat'
import { streamQuestion } from '../lib/api'

/** Generate a unique ID */
const uid = () => crypto.randomUUID()

/** Create a blank conversation */
const createConversation = (): Conversation => ({
    id: uid(),
    title: 'Nouveau chat',
    messages: [],
    createdAt: new Date(),
})

/**
 * Core chat state management hook.
 *
 * Handles:
 * - Multiple conversations with history
 * - Real-time streaming from the backend
 * - Abort/stop generation
 * - Error handling
 */
export function useChat() {
    const [conversations, setConversations] = useState<Conversation[]>([createConversation()])
    const [currentId, setCurrentId] = useState<string>(conversations[0].id)
    const [isStreaming, setIsStreaming] = useState(false)
    const abortRef = useRef<AbortController | null>(null)

    // ── Derived state ──
    const currentConversation = conversations.find(c => c.id === currentId) ?? conversations[0]
    const currentMessages = currentConversation.messages

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
        const conv = createConversation()
        setConversations(prev => [conv, ...prev])
        setCurrentId(conv.id)
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
                        },
                        onError: (error: string) => {
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
                        },
                    },
                    controller.signal
                )
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    updateMessages(msgs =>
                        msgs.map(m =>
                            m.id === assistantMsg.id
                                ? {
                                    ...m,
                                    content:
                                        'Désolé, une erreur est survenue. Vérifiez que le serveur Django est lancé.',
                                    isStreaming: false,
                                }
                                : m
                        )
                    )
                }
            } finally {
                setIsStreaming(false)
                abortRef.current = null
            }
        },
        [isStreaming, currentMessages.length, updateMessages, updateConversationTitle]
    )

    return {
        conversations,
        currentConversation,
        currentMessages,
        currentId,
        isStreaming,
        newChat,
        sendMessage,
        selectConversation,
        deleteConversation,
        stopGeneration,
    }
}
