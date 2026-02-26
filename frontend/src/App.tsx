import { useTheme } from './hooks/useTheme'
import { useChat } from './hooks/useChat'
import { ChatLayout } from './components/ChatLayout'

export default function App() {
    const { theme, toggleTheme } = useTheme()
    const chat = useChat()

    return (
        <div className={theme}>
            <ChatLayout chat={chat} theme={theme} onToggleTheme={toggleTheme} />
        </div>
    )
}
