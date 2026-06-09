import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./vitest.setup.js'],
        include: ['src/**/*.{test,spec}.{js,jsx}'],
        // התעלם מ-node_modules ומ-Capacitor (לא רץ ב-Node הסטנדרטי)
        exclude: ['node_modules', 'dist', '.venv', 'android'],
    },
});
