import type { Conversation } from '../types/chat'
import { useAudioSettings } from '../hooks/useAudioSettings'

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
    const { autoPlay, toggleAutoPlay } = useAudioSettings()

    return (
        <aside
            className={`
        fixed md:relative z-50 md:z-auto
        w-[260px] h-full flex-shrink-0
        bg-[#f9f9f9] dark:bg-[#171717]
        flex flex-col
        transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
        >
            {/* Header / Action Buttons */}
            <div className="p-3">
                {/* Optional Mobile only Close Button could go here */}

                <button
                    onClick={onNewChat}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg
                     hover:bg-stone-200/50 dark:hover:bg-[#202123]
                     transition-colors group"
                >
                    <div className="flex items-center gap-3 text-[14px] font-medium text-stone-800 dark:text-[#ececf1]">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border border-stone-200 dark:border-stone-700/50 bg-white dark:bg-[#202123] shadow-sm">
                            <span className="text-lg leading-none -mt-0.5">☪</span>
                        </div>
                        IA Coranique
                    </div>
                    {/* Write Icon */}
                    <svg className="w-4 h-4 text-stone-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                    </svg>
                </button>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1">
                {conversations.length > 0 && (
                    <div className="px-2 py-1 mt-1 mb-1">
                        <p className="text-[12px] font-semibold text-stone-400 dark:text-stone-500">Aujourd'hui</p>
                    </div>
                )}
                {conversations.map(conv => (
                    <div
                        key={conv.id}
                        className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer
                        transition-colors text-[14px]
                        ${conv.id === currentId
                                ? 'bg-stone-200/50 dark:bg-[#202123] text-stone-900 dark:text-stone-100 font-medium'
                                : 'text-stone-600 dark:text-[#ececf1] hover:bg-stone-200/50 dark:hover:bg-[#202123]'
                            }`}
                        onClick={() => onSelect(conv.id)}
                    >
                        <span className="truncate flex-1 font-normal opacity-90">{conv.title}</span>

                        {/* Delete button — visible on hover */}
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(conv.id) }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-500 hover:text-red-500 transition-colors"
                            aria-label="Supprimer"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>

            {/* Footer / User Settings & Profile */}
            <div className="p-3 flex flex-col gap-2 mt-auto">
                <div className="flex items-center gap-1.5 px-2">
                    {/* Theme toggle */}
                    <button
                        onClick={onToggleTheme}
                        className="p-1.5 rounded-lg hover:bg-stone-200/80 dark:hover:bg-[#202123] text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 transition-colors"
                        aria-label="Changer de thème"
                        title="Changer de thème"
                    >
                        {theme === 'light' ? (
                            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                            </svg>
                        ) : (
                            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                            </svg>
                        )}
                    </button>

                    {/* Auto-play audio toggle */}
                    <button
                        onClick={toggleAutoPlay}
                        className={`p-1.5 rounded-lg transition-colors ${autoPlay
                            ? 'bg-[#10a37f]/10 text-[#10a37f] dark:bg-[#10a37f]/20'
                            : 'hover:bg-stone-200/80 dark:hover:bg-[#202123] text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
                            }`}
                        aria-label="Lecture audio automatique"
                        title="Lecture audio automatique"
                    >
                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            {autoPlay ? (
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6L4.72 1.5M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                            )}
                        </svg>
                    </button>
                    <span className="text-[11px] text-stone-400 dark:text-stone-600 ml-auto">
                        abibou © 2026
                    </span>
                </div>

                {/* Profil Utilisateur */}
                {(() => {
                    const token = localStorage.getItem('token');
                    const userStr = localStorage.getItem('user');
                    const user = userStr ? JSON.parse(userStr) : null;

                    if (token && user) {
                        const initials = user.username ? user.username.substring(0, 2).toUpperCase() : '👤';
                        const planName = user.profile?.subscription_plan?.name || 'Free';
                        return (
                            <div className="relative group w-full">
                                <div className="flex items-center justify-between w-full p-2.5 hover:bg-stone-200/50 dark:hover:bg-[#202123] rounded-xl transition-colors cursor-pointer select-none">
                                    <div className="flex items-center gap-3 min-w-0 pr-1">
                                        <div className="w-[34px] h-[34px] rounded-full bg-[#10a37f] flex flex-shrink-0 items-center justify-center text-white text-[13px] font-semibold shadow-sm">
                                            {initials}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[14px] font-medium text-stone-900 dark:text-[#ececf1] truncate leading-tight">
                                                {user.username}
                                            </span>
                                            <span className="text-[12px] text-stone-500 dark:text-stone-400 capitalize mt-0.5">
                                                {planName}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        {/* Button Upgrade if 'Free' or basic */}
                                        {planName.toLowerCase() === 'free' && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); window.location.href = '#premium'; }}
                                                className="hidden md:block px-3 py-[5px] ml-1 bg-white hover:bg-stone-50 dark:bg-stone-800 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 rounded-full text-[12px] font-medium text-stone-800 dark:text-gray-300 transition-colors shadow-sm whitespace-nowrap"
                                            >
                                                Mettre à niveau
                                            </button>
                                        )}

                                        {/* Logout Button reveals on group hover */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const event = new CustomEvent('logout-user');
                                                document.dispatchEvent(event);
                                            }}
                                            className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Se déconnecter"
                                        >
                                            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    } else {
                        return (
                            <button
                                onClick={() => document.dispatchEvent(new CustomEvent('open-auth-modal'))}
                                className="w-full mt-2 flex items-center justify-center gap-2 text-[14px] py-[11px] px-3 rounded-xl bg-[#10a37f] hover:bg-[#0e906f] text-white font-medium transition-colors shadow-sm"
                            >
                                Se connecter
                            </button>
                        );
                    }
                })()}
            </div>
        </aside>
    )
}
