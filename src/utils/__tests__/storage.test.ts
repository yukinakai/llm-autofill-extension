import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getApiKey, saveApiKey, deleteApiKey } from '../storage';
import { ApiKey } from '../../options/components/ApiKeyForm';

vi.mock('webextension-polyfill', () => ({
  default: {
    storage: {
      sync: {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn()
      }
    }
  }
}));

describe('Storage Utils', () => {
  const mockApiKey: ApiKey = {
    key: 'sk-test-key',
    provider: 'openai'
  };

  const chrome = {
    storage: {
      sync: {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn()
      }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.chrome = chrome as any;
  });

  it('saves API key to chrome storage', async () => {
    await saveApiKey(mockApiKey);

    expect(chrome.storage.sync.set).toHaveBeenCalledWith({
      llm_api_key: mockApiKey
    });
  });

  it('loads API key from chrome storage', async () => {
    chrome.storage.sync.get.mockResolvedValue({
      llm_api_key: mockApiKey
    });

    const result = await getApiKey();
    expect(result).toEqual(mockApiKey);
  });

  it('returns null when no API key is stored', async () => {
    chrome.storage.sync.get.mockResolvedValue({});

    const result = await getApiKey();
    expect(result).toBeNull();
  });

  it('deletes API key from chrome storage', async () => {
    await deleteApiKey();

    expect(chrome.storage.sync.remove).toHaveBeenCalledWith('llm_api_key');
  });

  it('handles storage errors appropriately', async () => {
    chrome.storage.sync.set.mockRejectedValue(new Error('Storage error'));

    await expect(saveApiKey(mockApiKey)).rejects.toThrow('Storage error');
  });
});
