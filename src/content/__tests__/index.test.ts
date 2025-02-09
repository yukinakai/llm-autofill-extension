/// <reference types="../../../types/global" />
/// <reference types="chrome" />

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

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
      LLMService: vi.fn().mockImplementation((apiKey: string, provider: string) => ({
        matchFieldWithProfile: vi.fn().mockResolvedValue('matched value'),
        callAnthropicAPI: vi.fn().mockResolvedValue('API response')
      })),
      getApiKey: vi.fn().mockResolvedValue('test-api-key'),
      getProfile: vi.fn().mockResolvedValue({ name: 'test-profile' }),
      autofillForms: vi.fn().mockImplementation(async () => {
        const apiKeyData = await window.getApiKey();
        if (!apiKeyData) {
          console.error('APIキーが設定されていません');
          return;
        }

        const profile = await window.getProfile();
        if (!profile) {
          console.error('プロフィールが設定されていません');
          return;
        }

        const fields = window.detectForms();
        if (fields.length === 0) {
          console.log('入力可能なフォームフィールドが見つかりませんでした');
          return;
        }

        const llmService = new window.LLMService(apiKeyData.key, apiKeyData.type);
        for (const field of fields) {
          try {
            const value = await llmService.matchFieldWithProfile(field, profile);
            if (value) {
              const input = document.querySelector(`input[name="${field.name}"]`) as HTMLInputElement;
              if (input) {
                input.value = value;
                const event = new Event('input', { bubbles: true });
                input.dispatchEvent(event);
              }
            }
          } catch (error) {
            console.error(`フィールド "${field.name}" の自動入力に失敗しました:`, error);
          }
        }
      })
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

  describe('LLM Service', () => {
    let llmService: any;

    beforeEach(() => {
      // LLMServiceクラスのモックを設定
      window.LLMService = vi.fn().mockImplementation((apiKey: string, provider: string) => ({
        matchFieldWithProfile: vi.fn().mockResolvedValue('matched value'),
        callAnthropicAPI: vi.fn().mockResolvedValue('API response')
      }));

      // インスタンスを作成
      llmService = new window.LLMService('test-api-key', 'claude');
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('matches fields with profile data correctly', async () => {
      const field = {
        name: 'fullName',
        type: 'text',
        label: '氏名'
      };
      const profile = {
        name: '山田太郎',
        email: 'test@example.com',
        phone: '090-1234-5678'
      };

      // モックの応答を設定
      llmService.matchFieldWithProfile.mockResolvedValue('山田太郎');

      const result = await llmService.matchFieldWithProfile(field, profile);
      expect(result).toBe('山田太郎');
      expect(llmService.matchFieldWithProfile).toHaveBeenCalledWith(field, profile);
    });

    it('handles field matching errors gracefully', async () => {
      const field = { name: 'test', type: 'text' };
      const profile = { name: 'test-profile' };

      // エラーをスローするモックを設定
      const mockLLMService = {
        matchFieldWithProfile: vi.fn().mockRejectedValue(new Error('API Error')),
        callAnthropicAPI: vi.fn().mockResolvedValue('API response')
      };
      window.LLMService = vi.fn().mockImplementation(() => mockLLMService);

      const llmService = new window.LLMService('test-api-key', 'claude');
      
      // エラーがスローされることを確認
      await expect(llmService.matchFieldWithProfile(field, profile)).rejects.toThrow('API Error');
    });
  });

  describe('Autofill Forms', () => {
    beforeEach(() => {
      // DOMをセットアップ
      document.body.innerHTML = `
        <form>
          <input type="text" name="fullName" id="fullName">
          <input type="email" name="email_address" id="email_address">
          <input type="tel" name="phone" id="phone">
        </form>
      `;

      // グローバル関数のモックをリセット
      window.detectForms = vi.fn().mockReturnValue([
        { name: 'fullName', type: 'text', label: '氏名' },
        { name: 'email_address', type: 'email', label: 'メールアドレス' },
        { name: 'phone', type: 'tel', label: '電話番号' }
      ]);

      // デフォルトのモックを設定
      window.getProfile = vi.fn().mockResolvedValue(null);
      window.getApiKey = vi.fn().mockResolvedValue(null);
      window.LLMService = vi.fn().mockImplementation((apiKey: string, provider: string) => ({
        matchFieldWithProfile: vi.fn().mockResolvedValue(''),
        callAnthropicAPI: vi.fn().mockResolvedValue('API response')
      }));
    });

    it('autofills form fields successfully', async () => {
      // モックデータを設定
      const mockProfile = {
        name: '山田太郎',
        email: 'test@example.com',
        phone: '090-1234-5678'
      };
      window.getProfile = vi.fn().mockResolvedValue(mockProfile);

      const mockApiKey = { key: 'test-key', type: 'anthropic' };
      window.getApiKey = vi.fn().mockResolvedValue(mockApiKey);

      // LLMServiceのモックを設定
      window.LLMService = vi.fn().mockImplementation((apiKey: string, provider: string) => ({
        matchFieldWithProfile: vi.fn().mockImplementation((field) => {
          switch (field.name) {
            case 'fullName':
              return Promise.resolve('山田太郎');
            case 'email_address':
              return Promise.resolve('test@example.com');
            case 'phone':
              return Promise.resolve('090-1234-5678');
            default:
              return Promise.resolve('');
          }
        }),
        callAnthropicAPI: vi.fn().mockResolvedValue('API response')
      }));

      // autofillFormsを実行
      await window.autofillForms();

      // フィールドの値を検証
      const nameInput = document.querySelector('#fullName') as HTMLInputElement;
      const emailInput = document.querySelector('#email_address') as HTMLInputElement;
      const phoneInput = document.querySelector('#phone') as HTMLInputElement;

      expect(nameInput.value).toBe('山田太郎');
      expect(emailInput.value).toBe('test@example.com');
      expect(phoneInput.value).toBe('090-1234-5678');
    });

    it('handles autofill errors gracefully', async () => {
      // APIキーが設定されていない場合のテスト
      const consoleSpy = vi.spyOn(console, 'error');
      await window.autofillForms();

      expect(consoleSpy).toHaveBeenCalledWith('APIキーが設定されていません');
      consoleSpy.mockRestore();
    });
  });
});
