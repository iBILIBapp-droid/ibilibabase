import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    // Multi-Page Application (MPA) entry points
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                student: resolve(__dirname, 'student.html'),
                teacher: resolve(__dirname, 'teacher.html'),
                updatePassword: resolve(__dirname, 'update-password.html'),
            },
        },
        outDir: 'dist',
        emptyOutDir: true,
    },
    base: './',
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
    server: {
        port: 5173,
        open: true,
    },
});
