import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { WelcomeScreen } from './WelcomeScreen'
import type { useChat } from '../hooks/useChat'

interface ChatLayoutProps {
    chat: ReturnType<typeof useChat>
    theme: 'light' | 'dark'
    onToggleTheme: () => void
}

/**
 * Main layout — sidebar + chat area.
 * Handles mobile sidebar toggle and message scrolling.
 */
export function ChatLayout({ chat, theme, onToggleTheme }: ChatLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const hasMessages = chat.currentMessages.length > 0

    return (
        <div className="flex h-screen w-screen bg-white dark:bg-[#202123] text-stone-900 dark:text-stone-100 transition-colors duration-300 overflow-hidden font-sans">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden animate-fade-in"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <Sidebar
                conversations={chat.conversations}
                currentId={chat.currentId}
                isOpen={sidebarOpen}
                theme={theme}
                onNewChat={() => { chat.newChat(); setSidebarOpen(false) }}
                onSelect={(id) => { chat.selectConversation(id); setSidebarOpen(false) }}
                onDelete={chat.deleteConversation}
                onToggleTheme={onToggleTheme}
            />

            {/* Main chat area */}
            <main className="flex-1 flex flex-col min-w-0 relative">
                {/* Header - Mobile Only */}
                <header className="md:hidden flex items-center px-4 py-3 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-[#202123] z-10 sticky top-0">
                    {/* Hamburger */}
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="mr-3 p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors"
                        aria-label="Menu"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 12h18M3 18h18" />
                        </svg>
                    </button>

                    <div className="flex-1 text-center font-medium text-[15px] text-stone-800 dark:text-stone-200">
                        IA Coran
                    </div>
                    {/* Empty div for flex balance */}
                    <div className="w-8"></div>
                </header>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto" id="messages-scroll">
                    {hasMessages ? (
                        <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-1">
                            {chat.currentMessages.map(msg => (
                                <MessageBubble key={msg.id} message={msg} />
                            ))}

                            {/* Auto-scroll anchor */}
                            <div ref={el => el?.scrollIntoView({ behavior: 'smooth' })} />
                        </div>
                    ) : (
                        <WelcomeScreen onSuggestion={chat.sendMessage} />
                    )}
                </div>

                {/* Input area */}
                <ChatInput
                    onSend={chat.sendMessage}
                    onStop={chat.stopGeneration}
                    isStreaming={chat.isStreaming}
                    isLimitReached={chat.isLimitReached}
                    resetTime={chat.nextResetTime}
                    sourceFilter={chat.sourceFilter}
                    onSourceFilterChange={chat.setSourceFilter}
                />
            </main>
        </div>
    )
}
