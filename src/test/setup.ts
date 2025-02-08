import '@testing-library/jest-dom';
import { vi } from 'vitest';

// chrome APIのモック
const chrome = {
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
    },
  },
  runtime: {
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    sendMessage: vi.fn(),
  },
};

// グローバルにchromeを追加
(global as any).chrome = chrome;

// コンテンツスクリプトのグローバル関数をモック
(global as any).window.detectForms = vi.fn().mockImplementation(() => []);
(global as any).window.findLabel = vi.fn().mockImplementation(() => undefined);
(global as any).window.LLMService = vi.fn().mockImplementation(() => ({
  matchFieldWithProfile: vi.fn().mockResolvedValue(''),
}));
(global as any).window.getApiKey = vi.fn().mockResolvedValue(null);
(global as any).window.getProfile = vi.fn().mockResolvedValue(null);

// fetchのモック
(global as any).fetch = vi.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ content: [{ text: '' }] }),
  })
);
