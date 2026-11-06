import type { StreamEvent } from '../types/chat'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Token ${token}` } : {};
};

export async function login(username: string, password: string) {
    const response = await fetch(`${API_BASE}/auth/login/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Identifiants invalides');
    }
    return response.json();
}

export async function register(username: string, email: string, password: string) {
    const response = await fetch(`${API_BASE}/auth/register/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de l\'inscription');
    }
    return response.json();
}

export async function fetchHistory() {
    const response = await fetch(`${API_BASE}/history/`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
        }
    });

    if (!response.ok) throw new Error('Erreur récupération historique');
    return response.json();
}

/**
 * Stream a question to the Quran AI.
 *
 * Reads NDJSON from the streaming endpoint and calls the
 * appropriate callback for each event type.
 */
export async function streamQuestion(
    question: string,
    sourceFilter: string,
    callbacks: {
        onSources: (sources: any[]) => void
        onToken: (token: string) => void
        onDone: () => void
        onError: (error: string, errorCode?: string, resetTime?: string) => void
    },
    signal?: AbortSignal
): Promise<void> {
    const response = await fetch(`${API_BASE}/ask/stream/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
        },
        body: JSON.stringify({ q: question, limit: 5, source_filter: sourceFilter }),
        signal,
    })

    if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        const message =
            response.status === 401 ? 'Veuillez vous connecter pour utiliser le chat.'
                : data.error || `HTTP ${response.status}: ${response.statusText}`
        throw Object.assign(new Error(message), { status: response.status, resetTime: data.reset_time })
    }

    const handle = (line: string) => {
        if (!line.trim()) return
        let event: StreamEvent
        try {
            event = JSON.parse(line)
        } catch {
            return // skip malformed lines
        }
        switch (event.type) {
            case 'sources': callbacks.onSources(event.data); break
            case 'token': callbacks.onToken(event.data); break
            case 'done': callbacks.onDone(); break
            case 'error': callbacks.onError(event.data, event.error_code, event.reset_time); break
        }
    }

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()! // keep the incomplete line
        lines.forEach(handle)
    }
    handle(buffer + decoder.decode())
}
