import { useMemo, type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { linkifyCitations, refFromHref } from '../lib/sources'

const plugins = [remarkGfm]

interface MarkdownProps {
    children: string
    /** Labels of the sources shown under this answer ("2:153", "Bukhari 1302") */
    knownLabels?: Set<string>
    onCitation?: (label: string) => void
}

/** "(2:153)" → "2:153"; a long-form citation keeps its own words */
function citationText(children: ReactNode, label: string): ReactNode {
    const text = Array.isArray(children) ? children.join('') : String(children ?? '')
    return /^\(.+\)$/.test(text) ? label : children
}

/**
 * Answer renderer, loaded lazily (react-markdown + remark-gfm are the bulk of
 * the bundle and are not needed for the welcome screen).
 *
 * Each citation is drawn as the end of a toron beam — the same beam, colour
 * and label as in the sources wall below — and tapping it opens that source.
 */
export default function Markdown({ children, knownLabels, onCitation }: MarkdownProps) {
    const components = useMemo<Components>(() => ({
        a({ href, children: text }) {
            const label = refFromHref(href)
            if (!label) return <a href={href} target="_blank" rel="noopener noreferrer">{text}</a>

            if (!knownLabels?.has(label)) {
                return <span className="font-semibold text-ink-2">{text}</span>
            }
            const hadith = label.startsWith('Bukhari')
            const look = `relative inline whitespace-nowrap font-semibold ${hadith ? 'text-hadith decoration-hadith/40' : 'text-quran decoration-quran/40'}`
            const content = (
                <>
                    <span aria-hidden="true" className="relative mr-1 inline-block h-[0.42em] w-[0.95em] rounded-r-[2px] bg-ronier align-[0.12em]">
                        <span className="absolute inset-y-0 right-0 w-[0.22em] rounded-r-[2px] bg-clay" />
                    </span>
                    {citationText(text, label)}
                </>
            )
            // Same look while the answer streams (no reflow at the end); tappable once it is complete
            if (!onCitation) return <span className={look}>{content}</span>
            return (
                <button
                    type="button"
                    onClick={() => onCitation(label)}
                    aria-label={`Ouvrir la source ${label}`}
                    className={`${look} underline decoration-2 underline-offset-[0.2em] after:absolute after:-inset-x-1 after:-inset-y-2.5 after:content-['']`}
                >
                    {content}
                </button>
            )
        },
    }), [knownLabels, onCitation])

    return (
        <ReactMarkdown remarkPlugins={plugins} components={components}>
            {linkifyCitations(children)}
        </ReactMarkdown>
    )
}
