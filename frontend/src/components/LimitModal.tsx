import { useState } from 'react'

interface LimitModalProps {
    onClose: () => void
    resetTime?: string | null
}

export function LimitModal({ onClose, resetTime }: LimitModalProps) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative bg-white dark:bg-[#202123] w-full max-w-[400px] rounded-xl shadow-2xl overflow-hidden animate-fade-in-up">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/10 rounded-md transition-colors"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div className="p-6">
                    {/* Minimalist Elegant Icon */}
                    <div className="mb-4">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#10a37f]/10 dark:bg-[#10a37f]/20">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#10a37f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                            </svg>
                        </div>
                    </div>

                    <h2 className="text-xl font-semibold text-stone-900 dark:text-gray-100 mb-3">
                        Limite atteinte
                    </h2>

                    <p className="text-[14px] leading-relaxed text-stone-600 dark:text-gray-300 mb-4">
                        Vous avez atteint la limite de requêtes pour votre compte aujourd'hui.
                        Passez à Premium pour continuer vos recherches sans interruption.
                    </p>

                    {resetTime && (
                        <p className="text-[14px] leading-relaxed text-stone-600 dark:text-gray-300 mb-5">
                            Vos requêtes gratuites seront réinitialisées dans <strong>{resetTime}</strong>.
                        </p>
                    )}

                    <div className="space-y-3 mb-8">
                        <div className="flex items-center gap-2.5">
                            <svg className="w-4 h-4 text-[#10a37f] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                            <p className="text-[14px] text-stone-700 dark:text-gray-300">Accès illimité à l'IA Coranique</p>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <svg className="w-4 h-4 text-[#10a37f] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                            <p className="text-[14px] text-stone-700 dark:text-gray-300">Accès prioritaire aux nouvelles features</p>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <svg className="w-4 h-4 text-[#10a37f] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                            <p className="text-[14px] text-stone-700 dark:text-gray-300">Génération ultra-rapide</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                        <button
                            onClick={onClose}
                            className="text-[14px] text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 font-medium transition-colors"
                        >
                            Peut-être plus tard
                        </button>

                        <button
                            onClick={() => {
                                window.location.href = '#premium';
                                onClose();
                            }}
                            className="px-5 py-2.5 rounded hover:bg-[#0e906f] bg-[#10a37f] text-white font-medium text-[14px] transition-colors focus:ring-2 focus:ring-[#10a37f]/50 focus:outline-none"
                        >
                            Passer à Premium
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
