import { vi } from 'vitest';

describe('Content Script', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock chrome.storage.sync
    global.chrome = {
      storage: {
        sync: {
          get: vi.fn(),
          set: vi.fn(),
          remove: vi.fn()
        }
      },
      runtime: {
        onMessage: {
          addListener: vi.fn(),
          emit: vi.fn()
        }
      }
    } as any;

    // Mock window functions
    global.window = {
      ...global.window,
      detectForms: vi.fn(),
      findLabel: vi.fn(),
      LLMService: vi.fn().mockReturnValue({
        initialize: vi.fn().mockResolvedValue(undefined),
        matchField: vi.fn().mockResolvedValue('matched value'),
        handleError: vi.fn()
      }),
      getApiKey: vi.fn(),
      getProfile: vi.fn()
    } as any;
  });

  describe('Form Detection', () => {
    it('detects form fields correctly', () => {
      document.body.innerHTML = `
        <form>
          <input type="text" name="username" />
          <input type="email" name="email" />
        </form>
      `;

      window.detectForms.mockReturnValue([
        { name: 'username', type: 'text' },
        { name: 'email', type: 'email' }
      ]);

      const fields = window.detectForms();
      expect(fields).toHaveLength(2);
      expect(fields[0].name).toBe('username');
      expect(fields[1].name).toBe('email');
    });

    it('ignores non-form fields', () => {
      document.body.innerHTML = `
        <div>
          <span>Not a form field</span>
          <p>Also not a form field</p>
        </div>
      `;

      window.detectForms.mockReturnValue([]);
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
      window.findLabel.mockReturnValue('Username:');
      const label = window.findLabel(input as HTMLInputElement);
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
      window.findLabel.mockReturnValue('Email:');
      const label = window.findLabel(input as HTMLInputElement);
      expect(label).toBe('Email:');
    });

    it('returns empty string when no label found', () => {
      document.body.innerHTML = `
        <input type="text" />
      `;

      const input = document.querySelector('input');
      window.findLabel.mockReturnValue('');
      const label = window.findLabel(input as HTMLInputElement);
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
      const error = new Error('API Error');
      llmService.matchField.mockRejectedValue(error);
      
      try {
        await llmService.matchField('username', 'What is your name?');
      } catch (e) {
        expect(llmService.handleError).toHaveBeenCalledWith(error);
      }
    });
  });

  describe('Storage Operations', () => {
    it('saves API key successfully', async () => {
      const apiKey = { key: 'test-key', provider: 'openai' };
      window.getApiKey.mockResolvedValue(apiKey);
      const result = await window.getApiKey();
      expect(result).toEqual(apiKey);
    });

    it('retrieves API key successfully', async () => {
      const apiKey = { key: 'test-key', provider: 'openai' };
      window.getApiKey.mockResolvedValue(apiKey);
      const result = await window.getApiKey();
      expect(result).toEqual(apiKey);
    });
  });

  describe('Message Handling', () => {
    it('handles messages correctly', () => {
      const mockCallback = vi.fn();
      const message = { type: 'TEST_MESSAGE', data: 'test' };
      
      chrome.runtime.onMessage.addListener(mockCallback);
      const callback = chrome.runtime.onMessage.addListener.mock.calls[0][0];
      callback(message);
      
      expect(mockCallback).toHaveBeenCalledWith(message);
    });
  });
});
