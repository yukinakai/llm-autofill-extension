import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

describe('Content Script', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock chrome.storage.sync
    global.chrome = {
      storage: {
        sync: {
          get: vi.fn(),
          set: vi.fn(),
          remove: vi.fn()
        }
      }
    } as any;

    // Mock window functions
    global.window.LLMService = vi.fn().mockReturnValue({
      initialize: vi.fn().mockResolvedValue(undefined),
      matchField: vi.fn().mockResolvedValue('matched value'),
      handleError: vi.fn()
    });

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
    it('detects form fields correctly', () => {
      const fields = window.detectForms();
      expect(fields).toHaveLength(2);
      expect(fields[0].name).toBe('name');
      expect(fields[1].name).toBe('email');
    });

    it('ignores non-form fields', () => {
      document.body.innerHTML = `
        <div>
          <span>Not a form field</span>
          <p>Also not a form field</p>
        </div>
      `;

      const fields = window.detectForms();
      expect(fields).toHaveLength(0);
    });
  });

  describe('Label Finding', () => {
    it('finds label by explicit association', () => {
      document.body.innerHTML = `
        <label for="username">Username:</label>
        <input id="username" type="text" />
      `;

      const input = document.querySelector('input');
      const label = window.findLabel(input!);
      expect(label).toBe('Username:');
    });

    it('finds label by parent wrapper', () => {
      document.body.innerHTML = `
        <div class="field">
          <label>Email:</label>
          <input type="email" />
        </div>
      `;

      const input = document.querySelector('input');
      const label = window.findLabel(input!);
      expect(label).toBe('Email:');
    });

    it('returns empty string when no label found', () => {
      document.body.innerHTML = `
        <input type="text" />
      `;

      const input = document.querySelector('input');
      const label = window.findLabel(input!);
      expect(label).toBe('');
    });
  });

  describe('LLM Service', () => {
    it('should initialize with correct API key and provider', async () => {
      const llmService = window.LLMService();
      expect(llmService).toBeDefined();
      expect(llmService.initialize).toBeDefined();
      
      await llmService.initialize();
      expect(llmService.initialize).toHaveBeenCalled();
    });

    it('should match field with profile correctly', async () => {
      const llmService = window.LLMService();
      const result = await llmService.matchField('username', 'What is your name?');
      expect(result).toBe('matched value');
    });

    it('should handle API errors gracefully', async () => {
      const llmService = window.LLMService();
      llmService.matchField = vi.fn().mockRejectedValue(new Error('API Error'));
      
      try {
        await llmService.matchField('username', 'What is your name?');
      } catch (error) {
        expect(llmService.handleError).toHaveBeenCalled();
      }
    });
  });

  describe('Storage Operations', () => {
    it('saves API key successfully', async () => {
      const apiKey = { key: 'test-key', provider: 'openai' };
      await window.getApiKey();
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({ apiKey });
    });

    it('retrieves API key successfully', async () => {
      const apiKey = { key: 'test-key', provider: 'openai' };
      (chrome.storage.sync.get as vi.Mock).mockImplementation((key, callback) => {
        callback({ apiKey });
      });

      const result = await window.getApiKey();
      expect(result).toEqual(apiKey);
    });
  });

  describe('Message Handling', () => {
    it('handles messages correctly', () => {
      const mockCallback = vi.fn();
      const message = { type: 'TEST_MESSAGE', data: 'test' };
      
      chrome.runtime.onMessage.addListener(mockCallback);
      chrome.runtime.onMessage.emit(message);
      
      expect(mockCallback).toHaveBeenCalledWith(message);
    });
  });
});
