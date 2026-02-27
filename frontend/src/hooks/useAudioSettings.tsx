import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AudioSettings {
    autoPlay: boolean
    toggleAutoPlay: () => void
}

const AudioSettingsContext = createContext<AudioSettings>({
    autoPlay: false,
    toggleAutoPlay: () => { }
})

export function AudioSettingsProvider({ children }: { children: ReactNode }) {
    const [autoPlay, setAutoPlay] = useState<boolean>(() => {
        // Default to false unless explicitly saved as true
        return localStorage.getItem('iacoran-autoplay') === 'true'
    })

    useEffect(() => {
        localStorage.setItem('iacoran-autoplay', String(autoPlay))
    }, [autoPlay])

    const toggleAutoPlay = () => {
        setAutoPlay(prev => !prev)
    }

    return (
        <AudioSettingsContext.Provider value={{ autoPlay, toggleAutoPlay }}>
            {children}
        </AudioSettingsContext.Provider>
    )
}

/** Hook to access audio settings throughout the app */
export function useAudioSettings() {
    return useContext(AudioSettingsContext)
}
