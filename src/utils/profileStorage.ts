import { Profile } from '../types/profile';

/**
 * Chrome Storageからすべてのプロフィールを取得します
 */
export const getProfiles = async (): Promise<Profile[]> => {
  const result = await chrome.storage.sync.get('profiles');
  return result.profiles || [];
};

/**
 * 新しいプロフィールを保存します
 */
export const saveProfile = async (profile: Profile): Promise<void> => {
  const profiles = await getProfiles();
  await chrome.storage.sync.set({
    profiles: [...profiles, profile],
  });
};

/**
 * 既存のプロフィールを更新します
 */
export const updateProfile = async (profile: Profile): Promise<void> => {
  const profiles = await getProfiles();
  const index = profiles.findIndex((p) => p.id === profile.id);
  
  if (index === -1) {
    throw new Error('Profile not found');
  }

  profiles[index] = {
    ...profile,
    updatedAt: new Date().toISOString(),
  };

  await chrome.storage.sync.set({ profiles });
};

/**
 * プロフィールを削除します
 */
export const deleteProfile = async (profileId: string): Promise<void> => {
  const profiles = await getProfiles();
  const index = profiles.findIndex((p) => p.id === profileId);
  
  if (index === -1) {
    throw new Error('Profile not found');
  }

  profiles.splice(index, 1);
  await chrome.storage.sync.set({ profiles });
};
