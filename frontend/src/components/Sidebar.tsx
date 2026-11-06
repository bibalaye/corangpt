import { useState } from 'react'
import { Ellipsis, Settings, SquarePen, X } from 'lucide-react'
import type { Conversation } from '../types/chat'
import type { User } from '../hooks/useAuth'
import { IconButton } from './IconButton'

interface ConversationPanelProps {
    conversations: Conversation[]
    currentId: string
    user: User | null
    onNewChat: () => void
    onSelect: (id: string) => void
    onDelete: (id: string) => void
    onOpenSettings: () => void
    onSignIn: () => void
    /** Present in the mobile drawer only */
    onClose?: () => void
    titleId: string
}

const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

function groupLabel(date: Date): string {
    const days = Math.round((dayStart(new Date()) - dayStart(date)) / 86_400_000)
    if (days <= 0) return 'Aujourd’hui'
    if (days === 1) return 'Hier'
    if (days < 7) return 'Cette semaine'
    if (days < 31) return 'Ce mois-ci'
    return 'Plus ancien'
}

function timeLabel(date: Date): string {
    return dayStart(date) === dayStart(new Date())
        ? date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        : date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

/** "Vos questions": past conversations, new question, account and settings. */
export function ConversationPanel({ conversations, currentId, user, onNewChat, onSelect, onDelete, onOpenSettings, onSignIn, onClose, titleId }: ConversationPanelProps) {
    const [confirming, setConfirming] = useState<string | null>(null)
    const past = conversations.filter(c => c.messages.length > 0)
    const groups: { label: string; items: Conversation[] }[] = []
    for (const c of past) {
        const label = groupLabel(c.createdAt)
        const group = groups.find(g => g.label === label)
        if (group) group.items.push(c)
        else groups.push({ label, items: [c] })
    }

    return (
        <div className="flex h-full flex-col">
            <div className={onClose ? 'bg-shell pt-safe-t text-on-shell' : ''}>
                <div className="flex h-14 items-center gap-2 pl-4 pr-1.5">
                    <h2 id={titleId} className="flex-1 text-[1.0625rem] font-semibold">Vos questions</h2>
                    {onClose && (
                        <IconButton label="Fermer" tone="shell" onClick={onClose}>
                            <X aria-hidden="true" size={22} />
                        </IconButton>
                    )}
                </div>
            </div>

            <div className="px-3 pb-2 pt-3">
                <button
                    type="button"
                    onClick={onNewChat}
                    className="press flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-quran font-semibold text-quran-on hover:bg-quran/90"
                >
                    <SquarePen aria-hidden="true" size={18} />
                    Nouvelle question
                </button>
            </div>

            <nav aria-label="Conversations" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-4">
                {groups.length === 0 && (
                    <p className="px-2 pt-6 text-[0.9375rem] text-ink-3">
                        {user ? 'Vos questions apparaîtront ici.' : 'Connectez-vous pour retrouver vos questions ici.'}
                    </p>
                )}
                {groups.map(group => (
                    <section key={group.label} className="pt-4">
                        <h3 className="px-2 pb-1 text-[0.8125rem] font-semibold text-ink-3">{group.label}</h3>
                        <ul>
                            {group.items.map(c => {
                                const current = c.id === currentId
                                if (confirming === c.id) {
                                    return (
                                        <li key={c.id} className="my-1 rounded-2xl bg-danger/10 p-3">
                                            <p className="text-[0.9375rem] text-ink">Supprimer « {c.title} » ?</p>
                                            <p className="mt-0.5 text-[0.8125rem] text-ink-2">La question et sa réponse seront effacées de votre historique.</p>
                                            <div className="mt-3 flex gap-2">
                                                <button type="button" onClick={() => setConfirming(null)} className="press h-11 flex-1 rounded-xl bg-surface font-semibold text-ink">
                                                    Annuler
                                                </button>
                                                <button type="button" onClick={() => { setConfirming(null); onDelete(c.id) }} className="press h-11 flex-1 rounded-xl bg-danger font-semibold text-ground">
                                                    Supprimer
                                                </button>
                                            </div>
                                        </li>
                                    )
                                }
                                return (
                                    <li key={c.id} className={`flex items-center rounded-xl ${current ? 'bg-sunk' : ''}`}>
                                        <button
                                            type="button"
                                            aria-current={current ? 'page' : undefined}
                                            onClick={() => onSelect(c.id)}
                                            className="press flex min-h-12 min-w-0 flex-1 flex-col justify-center rounded-xl py-2 pl-3 pr-1 text-left hover:bg-sunk/60"
                                        >
                                            <span className={`w-full truncate text-[0.9375rem] ${current ? 'font-semibold text-ink' : 'text-ink'}`}>{c.title}</span>
                                            <span className="text-[0.8125rem] text-ink-3">{timeLabel(c.createdAt)}</span>
                                        </button>
                                        <IconButton label={`Options pour « ${c.title} »`} onClick={() => setConfirming(c.id)}>
                                            <Ellipsis aria-hidden="true" size={20} />
                                        </IconButton>
                                    </li>
                                )
                            })}
                        </ul>
                    </section>
                ))}
            </nav>

            <div className="flex items-center gap-3 border-t border-line px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-3">
                {user ? (
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-shell text-[0.875rem] font-semibold text-on-shell">
                            {user.username.slice(0, 2).toUpperCase()}
                        </span>
                        <span className="min-w-0">
                            <span className="block truncate font-semibold text-ink">{user.username}</span>
                            <span className="block text-[0.8125rem] text-ink-3">
                                Formule {user.profile?.subscription_plan?.name === 'free' ? 'gratuite' : user.profile?.subscription_plan?.name ?? 'gratuite'}
                            </span>
                        </span>
                    </div>
                ) : (
                    <button type="button" onClick={onSignIn} className="press h-11 flex-1 rounded-xl bg-ink font-semibold text-ground">
                        Se connecter
                    </button>
                )}
                <IconButton label="Réglages" onClick={onOpenSettings}>
                    <Settings aria-hidden="true" size={22} />
                </IconButton>
            </div>
        </div>
    )
}
