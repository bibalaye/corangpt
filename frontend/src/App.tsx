import { useEffect, useState } from 'react'
import { useChat } from './hooks/useChat'
import { useAuth } from './hooks/useAuth'
import { useMedia } from './hooks/useMedia'
import { ChatLayout } from './components/ChatLayout'
import { AuthSheet } from './components/AuthSheet'
import { LimitSheet } from './components/LimitSheet'

export default function App() {
    const { logout } = useAuth()
    const media = useMedia()
    const chat = useChat()
    const [authOpen, setAuthOpen] = useState(false)
    const [limitOpen, setLimitOpen] = useState(false)
    const [limitResetTime, setLimitResetTime] = useState<string | null>(null)

    // useChat and the API layer open these sheets through document events
    useEffect(() => {
        const openAuth = () => setAuthOpen(true)
        const openLimit = (e: Event) => {
            const reset = (e as CustomEvent).detail?.resetTime
            if (reset) setLimitResetTime(reset)
            setLimitOpen(true)
        }
        const signOut = () => logout()
        document.addEventListener('open-auth-modal', openAuth)
        document.addEventListener('open-limit-modal', openLimit)
        document.addEventListener('logout-user', signOut)
        return () => {
            document.removeEventListener('open-auth-modal', openAuth)
            document.removeEventListener('open-limit-modal', openLimit)
            document.removeEventListener('logout-user', signOut)
        }
    }, [logout])

    return (
        <>
            <ChatLayout
                chat={chat}
                onSignIn={() => setAuthOpen(true)}
                onSignOut={() => { media.stop(); logout() }}
                onShowLimit={() => setLimitOpen(true)}
            />
            <AuthSheet open={authOpen} onClose={() => setAuthOpen(false)} />
            <LimitSheet open={limitOpen} onClose={() => setLimitOpen(false)} resetTime={limitResetTime ?? chat.nextResetTime} />
        </>
    )
}
