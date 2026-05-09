// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'LandingFaroni/index.html'),
                admin: resolve(__dirname, 'AdminPageFaroni/admin.html'),
                login: resolve(__dirname, 'AdminLoginPageFaroni/LoginAdmin.html'),
            }
        }
    }
});