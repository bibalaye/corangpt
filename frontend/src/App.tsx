import { useState, useEffect } from 'react'
import { useTheme } from './hooks/useTheme'
import { useChat } from './hooks/useChat'
import { ChatLayout } from './components/ChatLayout'
import { AudioSettingsProvider } from './hooks/useAudioSettings'
import { AuthModal } from './components/AuthModal'
import { LimitModal } from './components/LimitModal'
import { useAuth } from './hooks/useAuth'

export default function App() {
    const { theme, toggleTheme } = useTheme()
    const { logout } = useAuth()
    const chat = useChat()
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
    const [isLimitModalOpen, setIsLimitModalOpen] = useState(false)
    const [limitResetTime, setLimitResetTime] = useState<string | null>(null)

    useEffect(() => {
        const handleOpenAuth = () => setIsAuthModalOpen(true);
        const handleOpenLimit = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail?.resetTime) {
                setLimitResetTime(customEvent.detail.resetTime);
            }
            setIsLimitModalOpen(true);
        };
        const handleLogout = () => logout();

        document.addEventListener('open-auth-modal', handleOpenAuth);
        document.addEventListener('open-limit-modal', handleOpenLimit);
        document.addEventListener('logout-user', handleLogout);

        return () => {
            document.removeEventListener('open-auth-modal', handleOpenAuth);
            document.removeEventListener('open-limit-modal', handleOpenLimit);
            document.removeEventListener('logout-user', handleLogout);
        };
    }, [logout]);

    return (
        <AudioSettingsProvider>
            <div className={theme}>
                <ChatLayout chat={chat} theme={theme} onToggleTheme={toggleTheme} />
                {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} />}
                {isLimitModalOpen && <LimitModal onClose={() => setIsLimitModalOpen(false)} resetTime={limitResetTime} />}
            </div>
        </AudioSettingsProvider>
    )
}
