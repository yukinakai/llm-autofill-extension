import { ApiKey } from '../options/components/ApiKeyForm';
import { StorageKey } from '../types';

// APIキーの取得
export async function getApiKey(): Promise<ApiKey | null> {
  try {
    const result = await chrome.storage.sync.get(StorageKey.ApiKey);
    return result[StorageKey.ApiKey] || null;
  } catch (error) {
    console.error('APIキーの取得に失敗しました:', error);
    return null;
  }
}

// プロフィール情報の取得
export async function getProfile(): Promise<Record<string, any> | null> {
  try {
    const result = await chrome.storage.sync.get(StorageKey.Profile);
    return result[StorageKey.Profile] || null;
  } catch (error) {
    console.error('プロフィール情報の取得に失敗しました:', error);
    return null;
  }
}

// APIキーの保存
export async function saveApiKey(apiKey: ApiKey): Promise<void> {
  try {
    await chrome.storage.sync.set({ [StorageKey.ApiKey]: apiKey });
  } catch (error) {
    console.error('APIキーの保存に失敗しました:', error);
    throw error;
  }
}

// APIキーの削除
export async function deleteApiKey(): Promise<void> {
  try {
    await chrome.storage.sync.remove(StorageKey.ApiKey);
  } catch (error) {
    console.error('APIキーの削除に失敗しました:', error);
    throw error;
  }
}

// プロフィール情報の保存
export async function saveProfile(profile: Record<string, any>): Promise<void> {
  try {
    await chrome.storage.sync.set({ [StorageKey.Profile]: profile });
  } catch (error) {
    console.error('プロフィール情報の保存に失敗しました:', error);
    throw error;
  }
}

// プロフィール情報の削除
export async function deleteProfile(): Promise<void> {
  try {
    await chrome.storage.sync.remove(StorageKey.Profile);
  } catch (error) {
    console.error('プロフィール情報の削除に失敗しました:', error);
    throw error;
  }
}
