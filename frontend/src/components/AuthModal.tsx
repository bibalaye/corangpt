import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { login, register } from '../lib/api';

export function AuthModal({ onClose }: { onClose: () => void }) {
    const { login: authLogin } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (isLogin) {
                const data = await login(username, password);
                authLogin(data.token, data.user);
                onClose();
            } else {
                const data = await register(username, email, password);
                authLogin(data.token, data.user);
                onClose();
            }
        } catch (err: any) {
            let errorMsg = err.message || 'Une erreur est survenue';
            // Empêcher l'affichage de codes HTML bruts 
            if (errorMsg.includes('<!DOCTYPE') || errorMsg.includes('<html')) {
                errorMsg = "Erreur de connexion au serveur (Le serveur est-il allumé ?).";
            }
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-900/60 backdrop-blur-md transition-opacity">
            <div className="w-full max-w-4xl flex bg-white dark:bg-stone-900 rounded-3xl shadow-2xl overflow-hidden border border-cream-200 dark:border-stone-800 relative min-h-[550px]">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 transition"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Left Side: Artwork/Branding (Hidden on mobile) */}
                <div className="hidden md:flex md:w-5/12 relative flex-col justify-between p-10 bg-gradient-to-br from-emerald-800 to-emerald-950 text-white overflow-hidden">
                    {/* Decorative pattern Background */}
                    <div className="absolute inset-0 opacity-10"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}>
                    </div>

                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl backdrop-blur flex items-center justify-center p-3 mb-6 shadow-xl border border-white/20">
                            <img src="/logo.svg" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <h2 className="text-3xl font-bold font-display leading-tight mb-2">
                            La sagesse du Coran,<br /><span className="text-emerald-300">augmentée par l'IA.</span>
                        </h2>
                        <p className="text-emerald-100/80 text-sm leading-relaxed mt-4 max-w-sm">
                            Accédez à l'assistant virtuel IA Coran. Interagissez avec le texte sacré, obtenez des explications sourcées, et naviguez dans les enseignements profonds avec un compte dédié.
                        </p>
                    </div>

                    <div className="relative z-10 hidden lg:block">
                        <div className="flex items-center gap-4 text-xs font-medium text-emerald-200 uppercase tracking-widest">
                            <span className="w-8 h-px bg-emerald-400"></span>
                            Abonnements Premium Inclus
                        </div>
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="w-full md:w-7/12 p-8 sm:p-12 flex flex-col justify-center bg-cream-50 dark:bg-stone-900 border-l border-cream-200 dark:border-stone-800">
                    <div className="max-w-sm mx-auto w-full">
                        {/* Mobile Logo */}
                        <div className="md:hidden flex flex-col items-center mb-8">
                            <img src="/logo.svg" alt="Logo" className="w-14 h-14 mb-4" />
                            <h2 className="text-2xl font-bold dark:text-stone-100 text-stone-900 font-display">
                                IA Coran
                            </h2>
                        </div>

                        {/* Title */}
                        <h3 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-1">
                            {isLogin ? 'Bon retour !' : 'Créer un compte'}
                        </h3>
                        <p className="text-sm text-stone-500 dark:text-stone-400 mb-8">
                            {isLogin
                                ? 'Renseignez vos identifiants pour continuer.'
                                : 'Rejoignez-nous et explorez le Coran avec l\'IA.'}
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="p-4 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-xl leading-relaxed">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2 uppercase tracking-wide">
                                    Nom d'utilisateur
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: votre nom d'utilisateur"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-4 py-3 bg-white dark:bg-stone-950 border border-cream-300 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none text-stone-900 dark:text-stone-100 placeholder-stone-400"
                                />
                            </div>

                            {!isLogin && (
                                <div>
                                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2 uppercase tracking-wide">
                                        Adresse Email
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="vous@exemple.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 bg-white dark:bg-stone-950 border border-cream-300 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none text-stone-900 dark:text-stone-100 placeholder-stone-400"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2 uppercase tracking-wide">
                                    Mot de passe
                                </label>
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-white dark:bg-stone-950 border border-cream-300 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none text-stone-900 dark:text-stone-100 placeholder-stone-400"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white transition-all duration-200 text-center text-sm font-bold shadow-md shadow-emerald-600/20 rounded-xl disabled:opacity-70 mt-6 flex justify-center items-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Connexion au serveur...
                                    </>
                                ) : (
                                    isLogin ? 'Se connecter' : "Créer mon compte"
                                )}
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-cream-200 dark:border-stone-800 text-center flex flex-col items-center">
                            <span className="text-sm text-stone-500 dark:text-stone-400 mb-2">
                                {isLogin ? "Nouveau sur IA Coran ?" : "Vous possédez déjà un compte ?"}
                            </span>
                            <button
                                onClick={() => {
                                    setIsLogin(!isLogin);
                                    setError('');
                                }}
                                className="text-sm font-bold text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors py-1 px-3 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                            >
                                {isLogin ? "Créer un compte gratuitement" : "Connectez-vous à votre compte"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
