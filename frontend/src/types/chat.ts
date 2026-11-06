/* ── Types for the chat application ── */

export interface QuranVerse {
    id?: string
    /** Canonical short label from the API: "2:153" or "Bukhari 1302" */
    label?: string
    reference: string
    text_ar: string
    text_fr: string
    score?: number
    source_type?: 'Coran' | 'Hadith'
    metadata?: {
        sourate?: number
        ayah?: number
        sourate_name?: string
        collection?: string
        book_number?: number
        hadith_number?: number
        grade?: string
    }
}

export interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    sources?: QuranVerse[]
    isStreaming?: boolean
    /** Set when the request failed: the message shows it with a retry action */
    error?: string
    /** ChatHistory id on the server, used to delete the conversation for real */
    serverId?: number
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
    | { type: 'done'; history_id?: number }
    | { type: 'error'; data: string; error_code?: string; reset_time?: string }
