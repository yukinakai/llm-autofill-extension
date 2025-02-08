import { defineConfig } from 'vite';
import { defineConfig as defineVitestConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// HTMLファイルを移動するプラグイン
const moveHtmlFiles = () => {
  return {
    name: 'move-html-files',
    writeBundle: () => {
      // HTMLファイルを移動
      ['popup', 'options'].forEach(dir => {
        if (fs.existsSync(resolve(__dirname, `dist/src/${dir}/index.html`))) {
          if (!fs.existsSync(resolve(__dirname, `dist/${dir}`))) {
            fs.mkdirSync(resolve(__dirname, `dist/${dir}`), { recursive: true });
          }
          fs.copyFileSync(
            resolve(__dirname, `dist/src/${dir}/index.html`),
            resolve(__dirname, `dist/${dir}/index.html`)
          );
        }
      });

      // 不要なディレクトリを削除
      if (fs.existsSync(resolve(__dirname, 'dist/src'))) {
        fs.rmSync(resolve(__dirname, 'dist/src'), { recursive: true });
      }
    },
  };
};

// アセットをコピーするプラグイン
const copyAssets = () => {
  return {
    name: 'copy-assets',
    writeBundle: () => {
      // manifest.jsonをコピー
      const manifest = JSON.parse(fs.readFileSync(resolve(__dirname, 'manifest.json'), 'utf-8'));
      fs.writeFileSync(
        resolve(__dirname, 'dist/manifest.json'),
        JSON.stringify(manifest, null, 2)
      );

      // アイコンをコピー
      const iconFiles = ['icon16.png', 'icon32.png', 'icon48.png', 'icon128.png'];
      iconFiles.forEach(file => {
        if (fs.existsSync(resolve(__dirname, `src/assets/${file}`))) {
          fs.copyFileSync(
            resolve(__dirname, `src/assets/${file}`),
            resolve(__dirname, `dist/${file}`)
          );
        }
      });
    },
  };
};

/// <reference types="vitest" />

// コンテンツスクリプト用の設定
const contentScriptConfig = defineConfig({
  build: {
    outDir: 'dist',
    lib: {
      entry: resolve(__dirname, 'src/content/index.ts'),
      name: 'content',
      formats: ['iife'],
      fileName: () => 'content.js'
    },
    rollupOptions: {
      output: {
        extend: true
      }
    }
  }
});

// メインの設定
const mainConfig = defineConfig({
  plugins: [react(), moveHtmlFiles(), copyAssets()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        'popup/index': resolve(__dirname, 'src/popup/index.html'),
        'options/index': resolve(__dirname, 'src/options/index.html'),
        'background/index': resolve(__dirname, 'src/background/index.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  }
});

// 環境変数に応じて設定を切り替え
export default process.env.BUILD_TARGET === 'content' ? contentScriptConfig : mainConfig;
