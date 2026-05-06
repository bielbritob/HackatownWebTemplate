// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'LandingPage/index.html'),
                admin: resolve(__dirname, 'AdminPage/admin.html'),
                login: resolve(__dirname, 'AdminLoginPage/LoginAdmin.html'),
            }
        }
    }
});