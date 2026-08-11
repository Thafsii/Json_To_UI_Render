import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return defineConfig({
    plugins: [react()],
    define: {
      'import.meta.env.AI_CHAT_URL': JSON.stringify(env.AI_CHAT_URL || env.VITE_AI_CHAT_URL || ''),
      'import.meta.env.AI_CHAT_API_KEY': JSON.stringify(env.AI_CHAT_API_KEY || env.VITE_AI_CHAT_API_KEY || ''),
      'import.meta.env.AI_CHAT_MODEL': JSON.stringify(env.AI_CHAT_MODEL || env.VITE_AI_CHAT_MODEL || ''),
    },
  });
};
