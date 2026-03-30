import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    // Multi-Page Application (MPA) entry points
    build: {
        rollupOptions: {
            input: {
                // Login page (root entry)
                main: resolve(__dirname, 'index.html'),
                // Student portal
                student: resolve(__dirname, 'student.html'),
                // Teacher portal
                teacher: resolve(__dirname, 'teacher.html'),
                // Password update
                updatePassword: resolve(__dirname, 'update-password.html'),
            },
        },
        outDir: 'dist',
        emptyOutDir: true,
    },
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
