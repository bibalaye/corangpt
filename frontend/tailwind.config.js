/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                arabic: ['Amiri', 'serif'],
            },
            colors: {
                cream: {
                    50: '#faf7f2',
                    100: '#f5f0e8',
                    200: '#ebe5d9',
                    300: '#e0d8cc',
                    400: '#c9bfb0',
                    500: '#b3a89a',
                },
                sand: {
                    50: '#f0ebe1',
                    100: '#e8e2d5',
                    200: '#ddd5c5',
                },
            },
            animation: {
                'fade-in-up': 'fadeInUp 0.35s ease-out',
                'fade-in': 'fadeIn 0.3s ease-out',
                'slide-in-left': 'slideInLeft 0.3s ease-out',
                'pulse-dot': 'pulseDot 1.4s ease-in-out infinite',
                'cursor-blink': 'cursorBlink 1s step-end infinite',
                'gentle-float': 'gentleFloat 3s ease-in-out infinite',
            },
            keyframes: {
                fadeInUp: {
                    from: { opacity: '0', transform: 'translateY(8px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                fadeIn: {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                },
                slideInLeft: {
                    from: { opacity: '0', transform: 'translateX(-12px)' },
                    to: { opacity: '1', transform: 'translateX(0)' },
                },
                pulseDot: {
                    '0%, 80%, 100%': { opacity: '0.3', transform: 'scale(0.8)' },
                    '40%': { opacity: '1', transform: 'scale(1)' },
                },
                cursorBlink: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0' },
                },
                gentleFloat: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-6px)' },
                },
            },
        },
    },
    plugins: [],
}
