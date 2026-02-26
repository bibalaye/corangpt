import { useState, useEffect, useCallback } from 'react'

type Theme = 'light' | 'dark'

/**
 * Manages light/dark theme with localStorage persistence.
 * Applies the 'dark' class to <html> for Tailwind dark mode.
 */
export function useTheme() {
    const [theme, setTheme] = useState<Theme>(() => {
        const stored = localStorage.getItem('iacoran-theme') as Theme | null
        if (stored) return stored
        // Respect OS preference
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    })

    useEffect(() => {
        const root = document.documentElement
        if (theme === 'dark') {
            root.classList.add('dark')
        } else {
            root.classList.remove('dark')
        }
        localStorage.setItem('iacoran-theme', theme)
    }, [theme])

    const toggleTheme = useCallback(() => {
        setTheme(prev => (prev === 'light' ? 'dark' : 'light'))
    }, [])

    return { theme, toggleTheme }
}
