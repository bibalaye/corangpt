import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    return {
        plugins: [react()],
        build: {
            target: 'es2022',
            rollupOptions: {
                output: {
                    // React rarely changes: a separate chunk stays cached across deploys
                    manualChunks(id) {
                        if (/node_modules[\/](react|react-dom|scheduler)[\/]/.test(id)) return 'react'
                    },
                },
            },
        },
        server: {
            port: 3000,
            allowedHosts: [
                'corangpt.onrender.com',
                'corangpt.fly.dev',
                'localhost'
            ],
            proxy: {
                '/api': {
                    target: env.VITE_DEV_API_URL || 'http://127.0.0.1:8000',
                    changeOrigin: true,
                },
            },
        },
    }
})
