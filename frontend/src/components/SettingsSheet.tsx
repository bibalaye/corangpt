import { LogOut, Moon, Sun, SunMoon, X } from 'lucide-react'
import { TEXT_SCALES, useSettings, type ThemePreference } from '../hooks/useSettings'
import type { User } from '../hooks/useAuth'
import { IconButton } from './IconButton'
import { Sheet } from './Sheet'

interface SettingsSheetProps {
    open: boolean
    onClose: () => void
    user: User | null
    onSignIn: () => void
    onSignOut: () => void
}

const THEMES: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
    { value: 'auto', label: 'Auto', Icon: SunMoon },
    { value: 'light', label: 'Jour', Icon: Sun },
    { value: 'dark', label: 'Nuit', Icon: Moon },
]

function Choice<T extends string | number>({ name, value, current, onChange, children, label }: {
    name: string; value: T; current: T; onChange: (v: T) => void; children: React.ReactNode; label: string
}) {
    return (
        <label className="relative flex-1">
            <input type="radio" name={name} value={String(value)} checked={current === value} onChange={() => onChange(value)} className="peer sr-only" aria-label={label} />
            <span className="press flex h-14 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl text-ink-2 peer-checked:bg-surface peer-checked:text-ink dark:peer-checked:bg-line peer-checked:shadow-[0_1px_3px_rgb(38_20_12/0.12)] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-quran">
                {children}
            </span>
        </label>
    )
}

export function SettingsSheet({ open, onClose, user, onSignIn, onSignOut }: SettingsSheetProps) {
    const s = useSettings()

    return (
        <Sheet open={open} onClose={onClose} labelledBy="settings-title">
            <div className="max-h-[inherit] overflow-y-auto overscroll-contain px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-2">
                <div className="flex items-center justify-between py-2">
                    <h2 id="settings-title" className="text-[1.25rem] font-semibold">Réglages</h2>
                    <IconButton label="Fermer les réglages" onClick={onClose} className="-mr-2">
                        <X aria-hidden="true" size={22} />
                    </IconButton>
                </div>

                <fieldset className="mt-3">
                    <legend className="font-semibold text-ink">Thème</legend>
                    <p className="text-[0.875rem] text-ink-3">Auto suit votre iPhone : nuit le soir, jour le matin.</p>
                    <div className="mt-2 flex gap-1 rounded-2xl bg-sunk p-1">
                        {THEMES.map(({ value, label, Icon }) => (
                            <Choice key={value} name="theme" value={value} current={s.theme} onChange={s.setTheme} label={label}>
                                <Icon aria-hidden="true" size={20} />
                                <span className="text-[0.8125rem] font-semibold">{label}</span>
                            </Choice>
                        ))}
                    </div>
                </fieldset>

                <fieldset className="mt-6">
                    <legend className="font-semibold text-ink">Taille du texte</legend>
                    <div className="mt-2 flex gap-1 rounded-2xl bg-sunk p-1">
                        {TEXT_SCALES.map((scale, i) => (
                            <Choice key={scale} name="text-scale" value={scale} current={s.textScale} onChange={s.setTextScale}
                                label={['Normal', 'Grand', 'Très grand', 'Maximum'][i]}>
                                <span aria-hidden="true" className="font-semibold leading-none" style={{ fontSize: `${0.95 + i * 0.25}rem` }}>A</span>
                            </Choice>
                        ))}
                    </div>
                    <div className="mt-3 rounded-2xl bg-surface p-4 dark:bg-ground" aria-hidden="true">
                        <p lang="ar" dir="rtl" className="reading-arabic text-right">إِنَّ اللَّهَ مَعَ الصَّابِرِينَ</p>
                        <p className="reading text-ink-2">Car Allah est avec ceux qui sont endurants.</p>
                    </div>
                </fieldset>

                <div className="mt-6 flex items-center gap-4">
                    <div className="min-w-0 flex-1">
                        <p id="autoplay-label" className="font-semibold text-ink">Récitation automatique</p>
                        <p id="autoplay-desc" className="text-[0.875rem] text-ink-3">Le premier verset cité est récité dès que la réponse arrive.</p>
                    </div>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={s.autoPlay}
                        aria-labelledby="autoplay-label"
                        aria-describedby="autoplay-desc"
                        onClick={() => s.setAutoPlay(!s.autoPlay)}
                        className={`press relative h-8 w-[3.25rem] shrink-0 rounded-full transition-colors ${s.autoPlay ? 'bg-quran' : 'bg-line'}`}
                    >
                        <span className={`absolute top-1 h-6 w-6 rounded-full bg-surface shadow-[0_1px_3px_rgb(38_20_12/0.25)] dark:bg-ink transition-transform duration-200 ease-out ${s.autoPlay ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                <div className="mt-8 border-t border-line pt-5">
                    {user ? (
                        <>
                            <p className="text-[0.875rem] text-ink-3">Connecté en tant que</p>
                            <p className="font-semibold text-ink">{user.username}</p>
                            {/* Isolated on purpose: nothing frequent sits next to it */}
                            <button
                                type="button"
                                onClick={() => { onClose(); onSignOut() }}
                                className="press mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-2xl font-semibold text-danger hover:bg-danger/10"
                            >
                                <LogOut aria-hidden="true" size={18} />
                                Se déconnecter
                            </button>
                        </>
                    ) : (
                        <button type="button" onClick={() => { onClose(); onSignIn() }} className="press h-12 w-full rounded-2xl bg-ink font-semibold text-ground">
                            Se connecter
                        </button>
                    )}
                </div>

                <p className="mt-6 text-center text-[0.75rem] text-ink-3">
                    Récitation : Mishary Alafasy, via everyayah.com
                </p>
            </div>
        </Sheet>
    )
}
