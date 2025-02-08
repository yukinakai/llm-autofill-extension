import { ApiKey } from '../options/components/ApiKeyForm';

const STORAGE_KEY = 'llm_api_keys';

export const saveApiKey = async (apiKey: ApiKey): Promise<void> => {
  try {
    await chrome.storage.sync.set({ [STORAGE_KEY]: apiKey });
  } catch (error) {
    console.error('APIキーの保存に失敗しました:', error);
    throw error;
  }
};

export const loadApiKey = async (): Promise<ApiKey | null> => {
  try {
    const result = await chrome.storage.sync.get(STORAGE_KEY);
    return result[STORAGE_KEY] || null;
  } catch (error) {
    console.error('APIキーの読み込みに失敗しました:', error);
    throw error;
  }
};

export const deleteApiKey = async (): Promise<void> => {
  try {
    await chrome.storage.sync.remove(STORAGE_KEY);
  } catch (error) {
    console.error('APIキーの削除に失敗しました:', error);
    throw error;
  }
};
