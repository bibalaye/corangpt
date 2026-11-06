import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, LoaderCircle, X } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { login, register } from '../lib/api'
import { IconButton } from './IconButton'
import { Sheet } from './Sheet'

const field = 'mt-1.5 h-12 w-full rounded-xl border border-line bg-surface px-4 text-ink placeholder:text-ink-3 focus:border-quran focus:outline-none focus:ring-2 focus:ring-quran/25'

export function AuthSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { login: authLogin } = useAuth()
    const [mode, setMode] = useState<'login' | 'register'>('login')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [email, setEmail] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const isLogin = mode === 'login'

    const submit = async (e: FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const data = isLogin ? await login(username.trim(), password) : await register(username.trim(), email.trim(), password)
            authLogin(data.token, data.user)
            onClose()
        } catch (err: any) {
            const message: string = err?.message || ''
            setError(
                message.includes('<') || message.includes('Failed to fetch') || message.includes('NetworkError')
                    ? 'Le serveur ne répond pas. Vérifiez votre connexion puis réessayez.'
                    : message || 'Une erreur est survenue.'
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <Sheet open={open} onClose={onClose} labelledBy="auth-title">
            <div className="max-h-[inherit] overflow-y-auto overscroll-contain px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-4">
                <div className="flex items-start justify-between">
                    <img src="/mark.svg" alt="" className="h-12 w-12 rounded-xl" />
                    <IconButton label="Fermer" onClick={onClose} className="-mr-2 -mt-1">
                        <X aria-hidden="true" size={22} />
                    </IconButton>
                </div>
                <h2 id="auth-title" className="mt-4 text-[1.5rem] font-semibold leading-tight tracking-[-0.01em]">
                    {isLogin ? 'Connexion' : 'Créer un compte'}
                </h2>
                <p className="mt-1 text-ink-2">Un compte garde vos questions et leurs réponses, pour y revenir plus tard.</p>

                <div role="tablist" aria-label="Type de compte" className="mt-5 flex gap-1 rounded-2xl bg-sunk p-1">
                    {(['login', 'register'] as const).map(m => (
                        <button
                            key={m}
                            type="button"
                            role="tab"
                            aria-selected={mode === m}
                            onClick={() => { setMode(m); setError('') }}
                            className={`press h-11 flex-1 rounded-xl text-[0.9375rem] font-semibold ${mode === m ? 'bg-surface text-ink shadow-[0_1px_3px_rgb(38_20_12/0.12)] dark:bg-line' : 'text-ink-2'}`}
                        >
                            {m === 'login' ? 'Se connecter' : 'Nouveau compte'}
                        </button>
                    ))}
                </div>

                <form onSubmit={submit} className="mt-5 space-y-4" noValidate={false}>
                    {error && (
                        <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-[0.9375rem] text-ink">{error}</p>
                    )}
                    <label className="block">
                        <span className="font-semibold text-ink">Nom d’utilisateur</span>
                        <input
                            className={field}
                            required
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            autoComplete="username"
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck={false}
                            enterKeyHint="next"
                        />
                    </label>
                    {!isLogin && (
                        <label className="block">
                            <span className="font-semibold text-ink">E-mail <span className="font-normal text-ink-3">(facultatif)</span></span>
                            <input
                                className={field}
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                autoComplete="email"
                                inputMode="email"
                                autoCapitalize="none"
                                enterKeyHint="next"
                            />
                        </label>
                    )}
                    <label className="block">
                        <span className="font-semibold text-ink">Mot de passe</span>
                        <span className="relative block">
                            <input
                                className={`${field} pr-12`}
                                type={showPassword ? 'text' : 'password'}
                                required
                                minLength={isLogin ? undefined : 8}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                autoComplete={isLogin ? 'current-password' : 'new-password'}
                                enterKeyHint="go"
                                aria-describedby={isLogin ? undefined : 'password-hint'}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(v => !v)}
                                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                                className="press absolute right-1 top-[calc(50%+0.1875rem)] grid h-11 w-11 -translate-y-1/2 place-items-center rounded-lg text-ink-3"
                            >
                                {showPassword ? <EyeOff aria-hidden="true" size={20} /> : <Eye aria-hidden="true" size={20} />}
                            </button>
                        </span>
                        {!isLogin && <span id="password-hint" className="mt-1 block text-[0.875rem] text-ink-3">8 caractères minimum, pas uniquement des chiffres.</span>}
                    </label>
                    <button
                        type="submit"
                        disabled={loading}
                        className="press flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-quran font-semibold text-quran-on disabled:opacity-70"
                    >
                        {loading && <LoaderCircle aria-hidden="true" size={18} className="animate-spin" />}
                        {loading ? 'Connexion…' : isLogin ? 'Se connecter' : 'Créer mon compte'}
                    </button>
                </form>
            </div>
        </Sheet>
    )
}
