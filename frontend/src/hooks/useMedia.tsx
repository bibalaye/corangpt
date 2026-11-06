import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

/**
 * One player for the whole app: a single recitation or read-aloud at a time.
 *
 * iOS only lets audio start from a tap. `unlock()` is called inside the tap
 * that sends a question, so the auto-played recitation that arrives seconds
 * later is allowed to start.
 */
type Status = 'loading' | 'playing' | 'paused' | 'error'
interface NowPlaying { kind: 'recitation' | 'speech'; id: string; status: Status }

interface Media {
    now: NowPlaying | null
    toggleRecitation: (id: string, url: string) => void
    playRecitation: (id: string, url: string) => void
    toggleSpeech: (id: string, text: string) => void
    stop: () => void
    unlock: () => void
    speechSupported: boolean
}

const SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='
const MediaContext = createContext<Media | null>(null)

export function MediaProvider({ children }: { children: ReactNode }) {
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const unlocked = useRef(false)
    const [now, setNow] = useState<NowPlaying | null>(null)
    const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

    const audio = useCallback(() => {
        if (!audioRef.current) {
            const a = new Audio()
            a.preload = 'none'
            a.addEventListener('waiting', () => setNow(n => (n?.kind === 'recitation' ? { ...n, status: 'loading' } : n)))
            a.addEventListener('playing', () => setNow(n => (n?.kind === 'recitation' ? { ...n, status: 'playing' } : n)))
            a.addEventListener('pause', () => setNow(n => (n?.kind === 'recitation' && n.status !== 'error' ? { ...n, status: 'paused' } : n)))
            a.addEventListener('ended', () => setNow(n => (n?.kind === 'recitation' ? null : n)))
            a.addEventListener('error', () => {
                if (a.src && !a.src.startsWith('data:')) setNow(n => (n?.kind === 'recitation' ? { ...n, status: 'error' } : n))
            })
            audioRef.current = a
        }
        return audioRef.current
    }, [])

    const stopSpeech = useCallback(() => { if (speechSupported) window.speechSynthesis.cancel() }, [speechSupported])

    const stop = useCallback(() => {
        audioRef.current?.pause()
        stopSpeech()
        setNow(null)
    }, [stopSpeech])

    const unlock = useCallback(() => {
        if (unlocked.current) return
        const a = audio()
        a.src = SILENT_WAV
        a.play().then(() => { a.pause(); unlocked.current = true }).catch(() => { /* still locked; a tap on Écouter works */ })
    }, [audio])

    const playRecitation = useCallback((id: string, url: string) => {
        stopSpeech()
        const a = audio()
        if (a.src !== url) a.src = url
        setNow({ kind: 'recitation', id, status: 'loading' })
        a.play().catch(() => setNow(n => (n?.id === id ? { ...n, status: 'paused' } : n)))
    }, [audio, stopSpeech])

    const toggleRecitation = useCallback((id: string, url: string) => {
        const a = audio()
        if (now?.kind === 'recitation' && now.id === id && !a.paused) {
            a.pause()
            return
        }
        playRecitation(id, url)
    }, [audio, now, playRecitation])

    const toggleSpeech = useCallback((id: string, text: string) => {
        if (!speechSupported) return
        if (now?.kind === 'speech' && now.id === id) { stop(); return }
        audioRef.current?.pause()
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'fr-FR'
        utterance.rate = 0.98
        utterance.onend = () => setNow(n => (n?.id === id ? null : n))
        utterance.onerror = () => setNow(n => (n?.id === id ? null : n))
        setNow({ kind: 'speech', id, status: 'playing' })
        window.speechSynthesis.speak(utterance)
    }, [now, speechSupported, stop])

    useEffect(() => () => { audioRef.current?.pause(); stopSpeech() }, [stopSpeech])

    const value = useMemo(
        () => ({ now, toggleRecitation, playRecitation, toggleSpeech, stop, unlock, speechSupported }),
        [now, toggleRecitation, playRecitation, toggleSpeech, stop, unlock, speechSupported]
    )
    return <MediaContext.Provider value={value}>{children}</MediaContext.Provider>
}

export function useMedia() {
    const ctx = useContext(MediaContext)
    if (!ctx) throw new Error('useMedia must be used inside MediaProvider')
    return ctx
}

export const recitationUrl = (sourate: number, ayah: number) =>
    `https://everyayah.com/data/Alafasy_128kbps/${String(sourate).padStart(3, '0')}${String(ayah).padStart(3, '0')}.mp3`
