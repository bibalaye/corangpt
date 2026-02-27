import { useTheme } from './hooks/useTheme'
import { useChat } from './hooks/useChat'
import { ChatLayout } from './components/ChatLayout'
import { AudioSettingsProvider } from './hooks/useAudioSettings'

export default function App() {
    const { theme, toggleTheme } = useTheme()
    const chat = useChat()

    return (
        <AudioSettingsProvider>
            <div className={theme}>
                <ChatLayout chat={chat} theme={theme} onToggleTheme={toggleTheme} />
            </div>
        </AudioSettingsProvider>
    )
}
