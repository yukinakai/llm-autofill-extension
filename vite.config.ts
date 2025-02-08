import { defineConfig } from 'vite';
import { defineConfig as defineVitestConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// アセットをコピーするプラグイン
const copyAssets = () => {
  return {
    name: 'copy-assets',
    writeBundle: () => {
      // manifest.jsonをコピー
      fs.copyFileSync(
        resolve(__dirname, 'manifest.json'),
        resolve(__dirname, 'dist/manifest.json')
      );

      // assetsディレクトリをコピー
      const srcAssetsDir = resolve(__dirname, 'src/assets');
      const distAssetsDir = resolve(__dirname, 'dist/assets');

      if (!fs.existsSync(distAssetsDir)) {
        fs.mkdirSync(distAssetsDir, { recursive: true });
      }

      if (fs.existsSync(srcAssetsDir)) {
        fs.readdirSync(srcAssetsDir).forEach(file => {
          fs.copyFileSync(
            resolve(srcAssetsDir, file),
            resolve(distAssetsDir, file)
          );
        });
      }
    },
  };
};

/// <reference types="vitest" />

export default defineConfig({
  plugins: [react(), copyAssets()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        options: resolve(__dirname, 'src/options/index.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
        content: resolve(__dirname, 'src/content/index.ts'),
      },
      output: {
        dir: 'dist',
        entryFileNames: 'src/[name]/index.js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]',
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
  },
} as any);
