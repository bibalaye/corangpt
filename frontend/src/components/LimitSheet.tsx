import { Hourglass } from 'lucide-react'
import { Sheet } from './Sheet'

export function LimitSheet({ open, onClose, resetTime }: { open: boolean; onClose: () => void; resetTime: string | null }) {
    return (
        <Sheet open={open} onClose={onClose} labelledBy="limit-title">
            <div className="px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-6">
                <span aria-hidden="true" className="grid h-12 w-12 place-items-center rounded-full bg-sunk text-shell dark:text-clay">
                    <Hourglass size={22} />
                </span>
                <h2 id="limit-title" className="mt-4 text-[1.375rem] font-semibold leading-tight">Limite du jour atteinte</h2>
                <p className="reading mt-2 text-ink-2">
                    {resetTime
                        ? <>Vos questions du jour se renouvellent dans <strong className="text-ink">{resetTime.replace(' ', ' ')}</strong>.</>
                        : 'Vos questions du jour se renouvellent à minuit (heure universelle).'}
                </p>
                <p className="reading mt-2 text-ink-2">
                    En attendant, vos réponses passées et leurs récitations restent disponibles dans « Vos questions ».
                </p>
                <button type="button" onClick={onClose} className="press mt-6 h-12 w-full rounded-2xl bg-ink font-semibold text-ground">
                    D’accord
                </button>
            </div>
        </Sheet>
    )
}
