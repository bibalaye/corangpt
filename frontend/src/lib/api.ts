import type { StreamEvent } from '../types/chat'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

/**
 * Stream a question to the Quran AI.
 *
 * Reads NDJSON from the streaming endpoint and calls the
 * appropriate callback for each event type.
 */
export async function streamQuestion(
    question: string,
    callbacks: {
        onSources: (sources: any[]) => void
        onToken: (token: string) => void
        onDone: () => void
        onError: (error: string) => void
    },
    signal?: AbortSignal
): Promise<void> {
    const response = await fetch(`${API_BASE}/ask/stream/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: question, limit: 5 }),
        signal,
    })

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()! // Keep incomplete line in buffer

        for (const line of lines) {
            if (!line.trim()) continue

            try {
                const event: StreamEvent = JSON.parse(line)

                switch (event.type) {
                    case 'sources':
                        callbacks.onSources(event.data)
                        break
                    case 'token':
                        callbacks.onToken(event.data)
                        break
                    case 'done':
                        callbacks.onDone()
                        break
                    case 'error':
                        callbacks.onError(event.data)
                        break
                }
            } catch {
                // Skip malformed JSON lines
            }
        }
    }
}
