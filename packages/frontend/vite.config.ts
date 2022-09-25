import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
    root: './src',
    envDir: '../', // relative path from root
    publicDir: '../public', // relative path from root
    define: {
        // global: 'globalThis', // これを有効化すると global と定義されたファイルを上書きしてしまう
    },
    build: {
        outDir: '../dist', // relative path from root
        emptyOutDir: true,
    },
    server: {
        open: true,
    },
    resolve: {
        alias: {
            process: 'process/browser',
            util: 'util',
        },
    },
    plugins: [react()],
});
