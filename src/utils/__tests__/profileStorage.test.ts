import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Profile } from '../../types/profile';
import {
  saveProfile,
  getProfiles,
  updateProfile,
  deleteProfile,
} from '../profileStorage';

// Chrome Storage APIのモック
const mockStorage = {
  sync: {
    get: vi.fn(),
    set: vi.fn(),
  },
};
vi.stubGlobal('chrome', { storage: mockStorage });

describe('profileStorage', () => {
  const mockProfile: Profile = {
    id: '1',
    name: 'Test Profile',
    fields: [{ key: 'name', value: 'John Doe' }],
    createdAt: new Date('2025-02-08T15:34:22.652Z').toISOString(),
    updatedAt: new Date('2025-02-08T15:34:22.652Z').toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.setSystemTime(new Date('2025-02-08T15:34:22.652Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('saveProfile', () => {
    it('新しいプロフィールを保存できること', async () => {
      mockStorage.sync.get.mockResolvedValue({ profiles: [] });
      await saveProfile(mockProfile);
      expect(mockStorage.sync.set).toHaveBeenCalledWith({
        profiles: [mockProfile],
      });
    });

    it('既存のプロフィールリストに新しいプロフィールを追加できること', async () => {
      const existingProfiles = [{ ...mockProfile, id: '2' }];
      mockStorage.sync.get.mockResolvedValue({ profiles: existingProfiles });
      await saveProfile(mockProfile);
      expect(mockStorage.sync.set).toHaveBeenCalledWith({
        profiles: [...existingProfiles, mockProfile],
      });
    });
  });

  describe('getProfiles', () => {
    it('保存されているプロフィールリストを取得できること', async () => {
      mockStorage.sync.get.mockResolvedValue({ profiles: [mockProfile] });
      const profiles = await getProfiles();
      expect(profiles).toEqual([mockProfile]);
    });

    it('プロフィールが存在しない場合は空配列を返すこと', async () => {
      mockStorage.sync.get.mockResolvedValue({});
      const profiles = await getProfiles();
      expect(profiles).toEqual([]);
    });
  });

  describe('updateProfile', () => {
    it('既存のプロフィールを更新できること', async () => {
      const updatedProfile = {
        ...mockProfile,
        name: 'Updated Profile',
      };
      mockStorage.sync.get.mockResolvedValue({ profiles: [mockProfile] });
      await updateProfile(updatedProfile);
      expect(mockStorage.sync.set).toHaveBeenCalledWith({
        profiles: [updatedProfile],
      });
    });

    it('存在しないプロフィールの更新時にエラーを投げること', async () => {
      mockStorage.sync.get.mockResolvedValue({ profiles: [] });
      await expect(updateProfile(mockProfile)).rejects.toThrow('Profile not found');
    });
  });

  describe('deleteProfile', () => {
    it('指定したIDのプロフィールを削除できること', async () => {
      mockStorage.sync.get.mockResolvedValue({ profiles: [mockProfile] });
      await deleteProfile(mockProfile.id);
      expect(mockStorage.sync.set).toHaveBeenCalledWith({ profiles: [] });
    });

    it('存在しないプロフィールの削除時にエラーを投げること', async () => {
      mockStorage.sync.get.mockResolvedValue({ profiles: [] });
      await expect(deleteProfile('nonexistent')).rejects.toThrow('Profile not found');
    });
  });
});
