import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const plugins = [remarkGfm]

/**
 * Markdown renderer, loaded lazily (react-markdown + remark-gfm are the bulk
 * of the bundle and aren't needed to show the welcome screen).
 */
export default function Markdown({ children }: { children: string }) {
    return <ReactMarkdown remarkPlugins={plugins}>{children}</ReactMarkdown>
}
