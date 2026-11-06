import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type ThemePreference = 'auto' | 'light' | 'dark'
export const TEXT_SCALES = [1, 1.15, 1.3, 1.5] as const

interface Settings {
    theme: ThemePreference
    resolvedTheme: 'light' | 'dark'
    setTheme: (t: ThemePreference) => void
    textScale: number
    setTextScale: (s: number) => void
    autoPlay: boolean
    setAutoPlay: (v: boolean) => void
}

const SHELL_COLOR = { light: '#8E3A1C', dark: '#3E1B0E' }

function read(key: string): string | null {
    try { return localStorage.getItem(key) } catch { return null }
}
function write(key: string, value: string) {
    try { localStorage.setItem(key, value) } catch { /* private mode: keep in memory */ }
}

const SettingsContext = createContext<Settings | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<ThemePreference>(() => {
        const v = read('iacoran-theme')
        return v === 'light' || v === 'dark' ? v : 'auto'
    })
    const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
    const [textScale, setTextScaleState] = useState(() => {
        const v = Number(read('iacoran-text-scale'))
        return (TEXT_SCALES as readonly number[]).includes(v) ? v : 1
    })
    const [autoPlay, setAutoPlayState] = useState(() => read('iacoran-autoplay') === 'true')

    useEffect(() => {
        const mq = window.matchMedia('(prefers-color-scheme: dark)')
        const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
        mq.addEventListener('change', onChange)
        return () => mq.removeEventListener('change', onChange)
    }, [])

    const resolvedTheme: 'light' | 'dark' = theme === 'auto' ? (systemDark ? 'dark' : 'light') : theme

    useEffect(() => {
        document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
        // Status bar / browser chrome follow the header colour of the current theme
        document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.setAttribute('content', SHELL_COLOR[resolvedTheme]))
    }, [resolvedTheme])

    useEffect(() => {
        document.documentElement.style.setProperty('--text-scale', String(textScale))
    }, [textScale])

    const setTheme = useCallback((t: ThemePreference) => { setThemeState(t); write('iacoran-theme', t) }, [])
    const setTextScale = useCallback((s: number) => { setTextScaleState(s); write('iacoran-text-scale', String(s)) }, [])
    const setAutoPlay = useCallback((v: boolean) => { setAutoPlayState(v); write('iacoran-autoplay', String(v)) }, [])

    const value = useMemo(
        () => ({ theme, resolvedTheme, setTheme, textScale, setTextScale, autoPlay, setAutoPlay }),
        [theme, resolvedTheme, setTheme, textScale, setTextScale, autoPlay, setAutoPlay]
    )
    return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
    const ctx = useContext(SettingsContext)
    if (!ctx) throw new Error('useSettings must be used inside SettingsProvider')
    return ctx
}
