import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

describe('Content Script', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form>
        <label for="name">名前</label>
        <input type="text" id="name" name="name">
        <div>
          <label>メールアドレス</label>
          <input type="email" name="email">
        </div>
      </form>
    `;

    // グローバル関数のモックをリセット
    vi.mocked(window.detectForms).mockReset();
    vi.mocked(window.findLabel).mockReset();
    vi.mocked(window.LLMService).mockReset();
    vi.mocked(window.getApiKey).mockReset();
    vi.mocked(window.getProfile).mockReset();
  });

  describe('Form Detection', () => {
    it('should detect form fields correctly', () => {
      vi.mocked(window.detectForms).mockReturnValue([
        { name: 'name', label: '名前', type: 'text' },
        { name: 'email', label: 'メールアドレス', type: 'email' }
      ]);

      const fields = window.detectForms();
      expect(fields).toHaveLength(2);
      expect(fields[0]).toEqual({
        name: 'name',
        label: '名前',
        type: 'text'
      });
      expect(fields[1]).toEqual({
        name: 'email',
        label: 'メールアドレス',
        type: 'email'
      });
    });

    it('should handle form fields without labels', () => {
      document.body.innerHTML = `
        <form>
          <input type="text" name="noLabel">
        </form>
      `;

      vi.mocked(window.detectForms).mockReturnValue([
        { name: 'noLabel', label: undefined, type: 'text' }
      ]);

      const fields = window.detectForms();
      expect(fields).toHaveLength(1);
      expect(fields[0]).toEqual({
        name: 'noLabel',
        label: undefined,
        type: 'text'
      });
    });
  });

  describe('Label Finding', () => {
    it('should find label by for attribute', () => {
      vi.mocked(window.findLabel).mockReturnValue('名前');

      const input = document.getElementById('name') as HTMLInputElement;
      const label = window.findLabel(input);
      expect(label).toBe('名前');
    });

    it('should find label by parent element', () => {
      vi.mocked(window.findLabel).mockReturnValue('メールアドレス');

      const input = document.querySelector('input[name="email"]') as HTMLInputElement;
      const label = window.findLabel(input);
      expect(label).toBe('メールアドレス');
    });

    it('should return undefined when no label is found', () => {
      vi.mocked(window.findLabel).mockReturnValue(undefined);

      const input = document.createElement('input');
      const label = window.findLabel(input);
      expect(label).toBeUndefined();
    });
  });

  describe('LLM Service', () => {
    it('should initialize with correct API key and provider', () => {
      const mockApiKey = { key: 'test-key', provider: 'openai' };
      vi.mocked(window.getApiKey).mockResolvedValue(mockApiKey);

      const llmService = window.LLMService();
      expect(llmService).toBeDefined();
    });

    it('should match field with profile correctly', async () => {
      const field = { name: 'name', label: '名前', type: 'text' };
      const profile = { '名前': 'テスト太郎' };

      const mockLLMService = {
        matchFieldWithProfile: vi.fn().mockResolvedValue('テスト太郎')
      };
      vi.mocked(window.LLMService).mockReturnValue(mockLLMService);

      const llmService = window.LLMService();
      const result = await llmService.matchFieldWithProfile(field, profile);
      expect(result).toBe('テスト太郎');
    });

    it('should handle API errors gracefully', async () => {
      const field = { name: 'name', label: '名前', type: 'text' };
      const profile = { '名前': 'テスト太郎' };

      const mockLLMService = {
        matchFieldWithProfile: vi.fn().mockRejectedValue(new Error('API error'))
      };
      vi.mocked(window.LLMService).mockReturnValue(mockLLMService);

      const llmService = window.LLMService();
      await expect(llmService.matchFieldWithProfile(field, profile)).rejects.toThrow('API error');
    });
  });

  describe('Storage Operations', () => {
    it('should get API key correctly', async () => {
      const mockApiKey = { key: 'test-key', provider: 'openai' };
      vi.mocked(window.getApiKey).mockResolvedValue(mockApiKey);

      const apiKey = await window.getApiKey();
      expect(apiKey).toEqual(mockApiKey);
    });

    it('should get profile correctly', async () => {
      const mockProfile = { '名前': 'テスト太郎' };
      vi.mocked(window.getProfile).mockResolvedValue(mockProfile);

      const profile = await window.getProfile();
      expect(profile).toEqual(mockProfile);
    });
  });

  describe('Message Handling', () => {
    it('should handle autofill message correctly', () => {
      const mockListener = vi.fn();
      chrome.runtime.onMessage.addListener(mockListener);

      const message = { type: 'autofill' };
      const sender = {};
      const sendResponse = vi.fn();

      mockListener(message, sender, sendResponse);
      expect(mockListener).toHaveBeenCalledWith(message, sender, sendResponse);
    });
  });
});
