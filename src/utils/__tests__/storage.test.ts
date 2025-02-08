import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveApiKey, loadApiKey, deleteApiKey } from '../storage';
import type { ApiKey } from '../../options/components/ApiKeyForm';

describe('Storage Utils', () => {
  const mockApiKey: ApiKey = {
    provider: 'openai',
    key: 'sk-test-key',
    timestamp: '2025/2/8 19:40:00'
  };

  beforeEach(() => {
    // Chrome Storage APIのモック
    global.chrome = {
      storage: {
        sync: {
          set: vi.fn(),
          get: vi.fn(),
          remove: vi.fn()
        }
      }
    } as any;
  });

  it('saves API key to chrome storage', async () => {
    const setSpy = vi.spyOn(chrome.storage.sync, 'set');
    await saveApiKey(mockApiKey);
    expect(setSpy).toHaveBeenCalledWith({ llm_api_keys: mockApiKey });
  });

  it('loads API key from chrome storage', async () => {
    const getSpy = vi.spyOn(chrome.storage.sync, 'get');
    getSpy.mockImplementation(() => Promise.resolve({ llm_api_keys: mockApiKey }));

    const result = await loadApiKey();
    expect(result).toEqual(mockApiKey);
    expect(getSpy).toHaveBeenCalledWith('llm_api_keys');
  });

  it('returns null when no API key is stored', async () => {
    const getSpy = vi.spyOn(chrome.storage.sync, 'get');
    getSpy.mockImplementation(() => Promise.resolve({}));

    const result = await loadApiKey();
    expect(result).toBeNull();
  });

  it('deletes API key from chrome storage', async () => {
    const removeSpy = vi.spyOn(chrome.storage.sync, 'remove');
    await deleteApiKey();
    expect(removeSpy).toHaveBeenCalledWith('llm_api_keys');
  });

  it('handles storage errors appropriately', async () => {
    const error = new Error('Storage error');
    vi.spyOn(chrome.storage.sync, 'set').mockRejectedValue(error);

    await expect(saveApiKey(mockApiKey)).rejects.toThrow('Storage error');
  });
});
