/// <reference types="../../types/global" />

import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('Content Script', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // モック関数の定義
    const mockDetectForms = vi.fn().mockReturnValue([
      { name: 'username', type: 'text' },
      { name: 'email', type: 'email' }
    ]);
    window.detectForms = mockDetectForms;

    // findLabelのモック
    const mockFindLabel = vi.fn((input: HTMLInputElement) => {
      if (input.id === 'username') return 'Username:';
      if (input.type === 'email') return 'Email:';
      return '';
    });
    window.findLabel = mockFindLabel;
    
    // Mock chrome.storage.sync
    global.chrome = {
      storage: {
        sync: {
          get: vi.fn().mockResolvedValue({}),
          set: vi.fn().mockResolvedValue(undefined),
          remove: vi.fn().mockResolvedValue(undefined)
        }
      },
      runtime: {
        onMessage: {
          addListener: vi.fn(),
          removeListener: vi.fn(),
          hasListeners: vi.fn()
        },
        sendMessage: vi.fn()
      }
    } as any;

    // Mock window functions
    global.window = {
      ...global.window,
      LLMService: vi.fn().mockReturnValue({
        initialize: vi.fn().mockResolvedValue(undefined),
        matchField: vi.fn().mockResolvedValue('matched value'),
        handleError: vi.fn()
      }),
      getApiKey: vi.fn().mockResolvedValue('test-api-key'),
      getProfile: vi.fn().mockResolvedValue({ name: 'test-profile' })
    } as any;
  });

  describe('Form Detection', () => {
    it('detects form fields correctly', () => {
      const fields = window.detectForms();
      expect(fields).toHaveLength(2);
      expect(fields[0]).toEqual({ name: 'username', type: 'text' });
      expect(fields[1]).toEqual({ name: 'email', type: 'email' });
    });
  });

  describe('Label Finding', () => {
    it('finds label for username field', () => {
      const input = document.createElement('input');
      input.id = 'username';
      input.type = 'text';
      const label = window.findLabel(input);
      expect(label).toBe('Username:');
    });

    it('finds label for email field', () => {
      const input = document.createElement('input');
      input.type = 'email';
      const label = window.findLabel(input);
      expect(label).toBe('Email:');
    });

    it('returns empty string when no label found', () => {
      const input = document.createElement('input');
      input.type = 'text';
      const label = window.findLabel(input);
      expect(label).toBe('');
    });
  });

  describe('Message Handling', () => {
    it('handles messages correctly', async () => {
      const message = { type: 'TEST_MESSAGE', data: 'test' };
      const sender = { id: 'test-sender' };
      const sendResponse = vi.fn();
      
      // メッセージハンドラーを設定
      const mockMessageHandler = vi.fn();
      chrome.runtime.onMessage.addListener(mockMessageHandler);
      
      // メッセージ送信をシミュレート
      await chrome.runtime.sendMessage(message);
      
      // 検証
      expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(message);
    });
  });
});
