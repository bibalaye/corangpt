import { useEffect, useRef, type ReactNode } from 'react'

interface SheetProps {
    open: boolean
    onClose: () => void
    labelledBy: string
    /** "sheet" rises from the bottom (centred on wide screens); "drawer" slides from the left */
    variant?: 'sheet' | 'drawer'
    children: ReactNode
}

/**
 * Modal surface on the native <dialog>: focus is trapped, Escape closes it and
 * the page behind becomes inert, with no extra JavaScript.
 */
export function Sheet({ open, onClose, labelledBy, variant = 'sheet', children }: SheetProps) {
    const ref = useRef<HTMLDialogElement>(null)
    const onCloseRef = useRef(onClose)
    onCloseRef.current = onClose

    useEffect(() => {
        const dialog = ref.current
        if (!dialog) return
        if (open && !dialog.open) dialog.showModal()
        if (!open && dialog.open) dialog.close()
    }, [open])

    useEffect(() => {
        const dialog = ref.current
        const handle = () => onCloseRef.current()
        dialog?.addEventListener('close', handle)
        return () => dialog?.removeEventListener('close', handle)
    }, [])

    return (
        <dialog
            ref={ref}
            aria-labelledby={labelledBy}
            className={variant}
            // A tap on the dimmed backdrop lands on the <dialog> element itself
            onClick={e => { if (e.target === ref.current) onCloseRef.current() }}
        >
            {open && children}
        </dialog>
    )
}
