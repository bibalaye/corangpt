import { useCallback, useEffect, useRef, useState } from 'react'
import { Menu, SquarePen } from 'lucide-react'
import type { useChat } from '../hooks/useChat'
import { useAuth } from '../hooks/useAuth'
import { useMedia } from '../hooks/useMedia'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { WelcomeScreen } from './WelcomeScreen'
import { ConversationPanel } from './Sidebar'
import { SettingsSheet } from './SettingsSheet'
import { IconButton } from './IconButton'
import { Sheet } from './Sheet'

interface ChatLayoutProps {
    chat: ReturnType<typeof useChat>
    onSignIn: () => void
    onSignOut: () => void
    onShowLimit: () => void
}

/**
 * Keep the shell exactly as tall as what is visible: when the iPhone keyboard
 * opens, the question field stays right above it and the header stays put.
 */
function useVisibleHeight() {
    useEffect(() => {
        const vv = window.visualViewport
        if (!vv) return
        const update = () => {
            document.documentElement.style.setProperty('--app-height', `${Math.round(vv.height)}px`)
            if (vv.offsetTop > 0) window.scrollTo(0, 0)
        }
        update()
        vv.addEventListener('resize', update)
        vv.addEventListener('scroll', update)
        return () => {
            vv.removeEventListener('resize', update)
            vv.removeEventListener('scroll', update)
        }
    }, [])
}

export function ChatLayout({ chat, onSignIn, onSignOut, onShowLimit }: ChatLayoutProps) {
    const { user } = useAuth()
    const media = useMedia()
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [settingsOpen, setSettingsOpen] = useState(false)
    const scrollRef = useRef<HTMLElement>(null)
    const messages = chat.currentMessages
    const last = messages[messages.length - 1]
    useVisibleHeight()

    // New message or conversation switch: go to the end of the thread
    useEffect(() => {
        const el = scrollRef.current
        el?.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }, [messages.length, chat.currentId])

    // While an answer streams, follow it — unless the reader scrolled up
    useEffect(() => {
        const el = scrollRef.current
        if (el && chat.isStreaming && el.scrollHeight - el.scrollTop - el.clientHeight < 160) {
            el.scrollTo({ top: el.scrollHeight, behavior: 'instant' })
        }
    }, [last?.content, last?.sources, chat.isStreaming])

    const send = useCallback((text: string) => {
        media.unlock() // inside the tap, so iOS lets the recitation auto-play later
        chat.sendMessage(text)
    }, [media, chat])

    const panel = (onClose?: () => void) => (
        <ConversationPanel
            titleId={onClose ? 'drawer-title' : 'sidebar-title'}
            conversations={chat.conversations}
            currentId={chat.currentId}
            user={user}
            onNewChat={() => { chat.newChat(); setDrawerOpen(false) }}
            onSelect={id => { chat.selectConversation(id); setDrawerOpen(false) }}
            onDelete={chat.deleteConversation}
            onOpenSettings={() => { setDrawerOpen(false); setSettingsOpen(true) }}
            onSignIn={() => { setDrawerOpen(false); onSignIn() }}
            onClose={onClose}
        />
    )

    return (
        <div className="flex h-[var(--app-height,100dvh)] overflow-hidden bg-ground">
            {/* Wide screens: the conversation list stays open beside the thread */}
            <aside aria-labelledby="sidebar-title" className="hidden w-80 shrink-0 border-r border-line bg-ground lg:block">
                {panel()}
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="shrink-0 bg-shell pl-safe-l pr-safe-r pt-safe-t text-on-shell">
                    <div className="mx-auto flex h-14 max-w-2xl items-center gap-1 px-1.5">
                        <IconButton label="Vos questions" tone="shell" onClick={() => setDrawerOpen(true)} className="lg:invisible">
                            <Menu aria-hidden="true" size={24} />
                        </IconButton>
                        <div className="flex flex-1 items-center justify-center gap-2.5">
                            <img src="/mark.svg" alt="" className="h-7 w-7 rounded-lg" />
                            <span className="text-[1.0625rem] font-semibold tracking-[-0.01em]">IA Coran</span>
                        </div>
                        <IconButton label="Nouvelle question" tone="shell" onClick={chat.newChat} className="lg:invisible">
                            <SquarePen aria-hidden="true" size={22} />
                        </IconButton>
                    </div>
                </header>

                <main ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                    <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col">
                        {messages.length > 0 ? (
                            <div className="pb-6">
                                <h1 className="sr-only">{chat.currentConversation.title}</h1>
                                {messages.map((msg, i) => (
                                    <MessageBubble key={msg.id} message={msg} isLast={i === messages.length - 1} onRetry={chat.retryLast} />
                                ))}
                            </div>
                        ) : (
                            <WelcomeScreen onSuggestion={send} />
                        )}
                    </div>
                </main>

                <ChatInput
                    onSend={send}
                    onStop={chat.stopGeneration}
                    isStreaming={chat.isStreaming}
                    isLimitReached={chat.isLimitReached}
                    resetTime={chat.nextResetTime}
                    onLimitTap={onShowLimit}
                    sourceFilter={chat.sourceFilter}
                    onSourceFilterChange={chat.setSourceFilter}
                />
            </div>

            <Sheet open={drawerOpen} onClose={() => setDrawerOpen(false)} labelledBy="drawer-title" variant="drawer">
                {panel(() => setDrawerOpen(false))}
            </Sheet>

            <SettingsSheet
                open={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                user={user}
                onSignIn={onSignIn}
                onSignOut={onSignOut}
            />
        </div>
    )
}
