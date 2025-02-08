import React, { useState, useEffect } from 'react';
import ProfileForm from './ProfileForm';
import ProfileList from './ProfileList';
import { saveProfile, getProfile } from '../../utils/storage';

export type Profile = {
  id: string;
  fields: { name: string; value: string }[];
};

const ProfileRegistration: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 保存されているプロフィールを読み込む
  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const savedProfile = await getProfile();
        if (savedProfile) {
          // プロフィールをストレージの形式から変換
          const fields = Object.entries(savedProfile).map(([name, value]) => ({
            name,
            value: String(value)
          }));
          setProfiles([{ id: 'default', fields }]);
        }
      } catch (error) {
        console.error('プロフィールの読み込みに失敗しました:', error);
        setError('プロフィールの読み込みに失敗しました');
      }
    };

    loadProfiles();
  }, []);

  const handleSaveProfile = async (fields: { name: string; value: string }[]) => {
    try {
      // プロフィールをストレージの形式に変換
      const profileData = fields.reduce((acc, { name, value }) => {
        acc[name] = value;
        return acc;
      }, {} as Record<string, string>);

      // ストレージに保存
      await saveProfile(profileData);

      // ローカルステートを更新
      setProfiles([{ id: 'default', fields }]);
      setError(null);
    } catch (error) {
      console.error('プロフィールの保存に失敗しました:', error);
      setError('プロフィールの保存に失敗しました');
    }
  };

  const handleEditProfile = async (id: string, fields: { name: string; value: string }[]) => {
    try {
      // プロフィールをストレージの形式に変換
      const profileData = fields.reduce((acc, { name, value }) => {
        acc[name] = value;
        return acc;
      }, {} as Record<string, string>);

      // ストレージに保存
      await saveProfile(profileData);

      // ローカルステートを更新
      setProfiles(profiles.map(profile => 
        profile.id === id ? { ...profile, fields } : profile
      ));
      setError(null);
    } catch (error) {
      console.error('プロフィールの更新に失敗しました:', error);
      setError('プロフィールの更新に失敗しました');
    }
  };

  const handleDeleteProfile = async () => {
    try {
      // ストレージから削除
      await saveProfile({});

      // ローカルステートを更新
      setProfiles([]);
      setError(null);
    } catch (error) {
      console.error('プロフィールの削除に失敗しました:', error);
      setError('プロフィールの削除に失敗しました');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-4">プロフィール登録</h2>
        <ProfileForm 
          onSave={handleSaveProfile}
          initialFields={profiles[0]?.fields || []}
        />
      </div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {profiles.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">登録済みプロフィール</h2>
          <ProfileList
            profiles={profiles}
            onEdit={handleEditProfile}
            onDelete={handleDeleteProfile}
          />
        </div>
      )}
    </div>
  );
};

export default ProfileRegistration;
