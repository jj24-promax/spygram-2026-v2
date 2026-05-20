import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: '/', // Alterado de './' para '/' para permitir o roteamento correto de SPAs e recarregamentos em rotas profundas
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY), // Mantido para compatibilidade
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY), // Mantido para compatibilidade
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});