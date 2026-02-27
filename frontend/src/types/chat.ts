/* ── Types for the chat application ── */

export interface QuranVerse {
    reference: string
    text_ar: string
    text_fr: string
    score?: number
    source_type?: 'Coran' | 'Hadith'
    normalized_fr?: string
    normalized_ar?: string
    metadata?: {
        sourate: number
        ayah: number
        sourate_name: string
    }
}

export interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    sources?: QuranVerse[]
    isStreaming?: boolean
    createdAt: Date
}

export interface Conversation {
    id: string
    title: string
    messages: Message[]
    createdAt: Date
}

/** NDJSON event types from the streaming endpoint */
export type StreamEvent =
    | { type: 'sources'; data: QuranVerse[] }
    | { type: 'token'; data: string }
    | { type: 'done' }
    | { type: 'error'; data: string; error_code?: string; reset_time?: string }
