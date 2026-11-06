import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    label: string
    tone?: 'shell' | 'ground'
    children: ReactNode
}

/** 44×44 pt touch target, labelled for VoiceOver. */
export function IconButton({ label, tone = 'ground', className = '', children, ...props }: IconButtonProps) {
    const toneClass = tone === 'shell'
        ? 'text-on-shell active:bg-shell-deep hover:bg-shell-deep'
        : 'text-ink-2 active:bg-sunk hover:bg-sunk'
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            className={`press inline-grid h-11 w-11 shrink-0 place-items-center rounded-xl ${toneClass} ${className}`}
            {...props}
        >
            {children}
        </button>
    )
}
