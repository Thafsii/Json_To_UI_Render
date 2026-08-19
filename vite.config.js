import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return defineConfig({
    plugins: [react()],
    define: {
      // Only non-secret endpoint config is baked into the client bundle.
      // The API key is intentionally NOT defined here — client bundles are
      // fully readable by anyone who loads the app, so baking in a secret
      // would ship it to every visitor. The key is entered by the user at
      // runtime (kept in memory only) via the Remote AI settings panel.
      'import.meta.env.AI_CHAT_URL': JSON.stringify(env.AI_CHAT_URL || env.VITE_AI_CHAT_URL || ''),
      'import.meta.env.AI_CHAT_MODEL': JSON.stringify(env.AI_CHAT_MODEL || env.VITE_AI_CHAT_MODEL || ''),
      'import.meta.env.AI_CHAT_AUTH_HEADER': JSON.stringify(env.AI_CHAT_AUTH_HEADER || env.VITE_AI_CHAT_AUTH_HEADER || ''),
    },
  });
};
