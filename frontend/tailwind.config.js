/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`

export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    darkMode: 'class',
    // Hover styles only on devices that really hover (no sticky hover after a tap on iPhone)
    future: { hoverOnlyWhenSupported: true },
    theme: {
        extend: {
            colors: {
                ground: token('ground'),
                surface: token('surface'),
                sunk: token('sunk'),
                line: token('line'),
                ink: { DEFAULT: token('ink'), 2: token('ink-2'), 3: token('ink-3') },
                shell: { DEFAULT: token('shell'), deep: token('shell-deep') },
                'on-shell': { DEFAULT: token('on-shell'), 2: token('on-shell-2') },
                quran: { DEFAULT: token('quran'), on: token('on-quran') },
                hadith: token('hadith'),
                ronier: token('ronier'),
                clay: token('clay'),
                danger: token('danger'),
            },
            fontFamily: {
                sans: ['Salawat', '-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"Segoe UI"', 'system-ui', 'Roboto', 'sans-serif'],
                arabic: ['Salawat', 'Harmattan', '"Geeza Pro"', '"Noto Naskh Arabic"', 'serif'],
            },
            spacing: {
                'safe-t': 'env(safe-area-inset-top, 0px)',
                'safe-b': 'env(safe-area-inset-bottom, 0px)',
                'safe-l': 'env(safe-area-inset-left, 0px)',
                'safe-r': 'env(safe-area-inset-right, 0px)',
            },
            transitionTimingFunction: {
                out: 'cubic-bezier(0.16, 1, 0.3, 1)',
            },
            keyframes: {
                // The signature move: a toron beam pushed out of the wall
                extrude: {
                    from: { transform: 'scaleX(0)' },
                    to: { transform: 'scaleX(1)' },
                },
                rise: {
                    from: { opacity: '0', transform: 'translateY(6px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                breathe: {
                    '0%, 100%': { opacity: '0.35' },
                    '50%': { opacity: '1' },
                },
            },
            animation: {
                extrude: 'extrude 520ms cubic-bezier(0.16, 1, 0.3, 1) both',
                rise: 'rise 360ms cubic-bezier(0.16, 1, 0.3, 1) both',
                breathe: 'breathe 1.4s ease-in-out infinite',
            },
        },
    },
    plugins: [],
}
