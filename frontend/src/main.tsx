import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { AuthProvider } from './hooks/useAuth'
import { SettingsProvider } from './hooks/useSettings'
import { MediaProvider } from './hooks/useMedia'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <AuthProvider>
            <SettingsProvider>
                <MediaProvider>
                    <App />
                </MediaProvider>
            </SettingsProvider>
        </AuthProvider>
    </StrictMode>
)

// Fetch the Markdown chunk once the page is idle, before the first answer needs it
const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 1500))
idle(() => { import('./components/Markdown') })

// Offline shell + instant repeat visits on slow connections (production builds only)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => { /* the app works without it */ })
    })
}
