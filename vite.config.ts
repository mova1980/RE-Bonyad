import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Conf cache bust: 1405-02-09T14:56:00Z
const getBestApiKey = (env: Record<string, string>) => {
  const combinedEnv = { ...process.env, ...env };
  
  // Safe diagnostics to see what key names exist in the build environment
  const keyNames = Object.keys(combinedEnv).filter(k => 
    k.toUpperCase().includes('GEMINI') || 
    k.toUpperCase().includes('YADEGARAN') || 
    k.toUpperCase().includes('API_KEY') ||
    k.toUpperCase().includes('SECRET')
  );
  
  console.log("Vite Build - Found matching env keys:", keyNames.map(k => {
    const val = combinedEnv[k] || '';
    return `${k}: length=${val.length}, startsWith=${val.substring(0, 4)}...`;
  }));

  const keys: string[] = [];
  
  // 1. Explicitly check for Yadegaran-1405-new
  if (combinedEnv['Yadegaran-1405-new']) {
    keys.push(combinedEnv['Yadegaran-1405-new']);
  }
  
  // 2. Standard keys
  if (combinedEnv.GEMINI_API_KEY) keys.push(combinedEnv.GEMINI_API_KEY);
  if (combinedEnv.VITE_GEMINI_API_KEY) keys.push(combinedEnv.VITE_GEMINI_API_KEY);
  
  // 3. Look for any environment variables containing "yadegaran" or "gemini" in their names
  for (const [key, val] of Object.entries(combinedEnv)) {
    if (key.toLowerCase().includes('yadegaran') || key.toLowerCase().includes('gemini')) {
      if (val && !keys.includes(val)) {
        keys.push(val);
      }
    }
  }

  const cleanKeys = keys.map(k => (k || '').trim());
  const placeholders = ['GEMINI_API_KEY', 'YOUR_API_KEY', 'MY_GEMINI_API_KEY', 'VITE_GEMINI_API_KEY', 'null', 'undefined', ''];
  
  // Try to find a valid key. We accept keys with or without AIza prefix, as long as they are not placeholders.
  const plausibleKey = cleanKeys.find(k => k && !placeholders.includes(k) && !k.includes('API_KEY') && k.length >= 10);
  if (plausibleKey) return plausibleKey;

  return cleanKeys[0] || '';
};

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        hmr: false,
        watch: {
          ignored: ['**/.gemini/**', '**/node_modules/**', '**/dist/**'],
          usePolling: false
        }
      },
      plugins: [react()],
      define: {
        'process.env.GEMINI_API_KEY': JSON.stringify(getBestApiKey(env)),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
