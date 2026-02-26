import type { Conversation } from '../types/chat'

interface SidebarProps {
    conversations: Conversation[]
    currentId: string
    isOpen: boolean
    theme: 'light' | 'dark'
    onNewChat: () => void
    onSelect: (id: string) => void
    onDelete: (id: string) => void
    onToggleTheme: () => void
}

/**
 * Left sidebar with conversation history, new chat button, and theme toggle.
 * Slides in on mobile, always visible on desktop.
 */
export function Sidebar({
    conversations,
    currentId,
    isOpen,
    theme,
    onNewChat,
    onSelect,
    onDelete,
    onToggleTheme,
}: SidebarProps) {
    return (
        <aside
            className={`
        fixed md:relative z-50 md:z-auto
        w-[280px] h-full flex-shrink-0
        bg-sand-50 dark:bg-stone-900
        border-r border-cream-300/60 dark:border-stone-800
        flex flex-col
        transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
        >
            {/* Header */}
            <div className="p-4">
                <h1 className="text-base font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-2 mb-4 px-1">
                    <span className="text-lg">☪</span>
                    IA Coran
                </h1>

                <button
                    onClick={onNewChat}
                    className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl
                     bg-white dark:bg-stone-800 border border-cream-300 dark:border-stone-700
                     text-sm font-medium text-stone-700 dark:text-stone-300
                     hover:bg-cream-100 dark:hover:bg-stone-750 hover:border-stone-300 dark:hover:border-stone-600
                     shadow-sm hover:shadow transition-all duration-150 active:scale-[0.98]"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
                    </svg>
                    Nouveau chat
                </button>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
                {conversations.map(conv => (
                    <div
                        key={conv.id}
                        className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer
                        transition-all duration-150 text-sm
                        ${conv.id === currentId
                                ? 'bg-cream-200/80 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-medium'
                                : 'text-stone-500 dark:text-stone-400 hover:bg-cream-100 dark:hover:bg-stone-800/60 hover:text-stone-700 dark:hover:text-stone-300'
                            }`}
                        onClick={() => onSelect(conv.id)}
                    >
                        <svg className="w-4 h-4 flex-shrink-0 opacity-50" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                        </svg>
                        <span className="truncate flex-1">{conv.title}</span>

                        {/* Delete button — visible on hover */}
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(conv.id) }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-stone-400 hover:text-red-500 transition-all"
                            aria-label="Supprimer"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-cream-300/60 dark:border-stone-800 flex items-center justify-between">
                {/* Theme toggle */}
                <button
                    onClick={onToggleTheme}
                    className="p-2 rounded-lg hover:bg-cream-200 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
                    aria-label="Changer de thème"
                >
                    {theme === 'light' ? (
                        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                        </svg>
                    ) : (
                        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                        </svg>
                    )}
                </button>

                <span className="text-xs text-stone-400 dark:text-stone-600">
                    abibou © 2026
                </span>
            </div>
        </aside>
    )
}
