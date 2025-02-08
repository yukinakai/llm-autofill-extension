import React, { useState } from 'react';
import ProfileForm from './ProfileForm';
import ProfileList from './ProfileList';

export type Profile = {
  id: string;
  fields: { name: string; value: string }[];
};

const ProfileRegistration: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);

  const handleSaveProfile = (fields: { name: string; value: string }[]) => {
    const newProfile: Profile = {
      id: crypto.randomUUID(),
      fields,
    };
    setProfiles([...profiles, newProfile]);
  };

  const handleEditProfile = (id: string, fields: { name: string; value: string }[]) => {
    setProfiles(profiles.map(profile => 
      profile.id === id ? { ...profile, fields } : profile
    ));
  };

  const handleDeleteProfile = (id: string) => {
    setProfiles(profiles.filter(profile => profile.id !== id));
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-4">新規プロフィール登録</h2>
        <ProfileForm onSave={handleSaveProfile} />
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-4">登録済みプロフィール</h2>
        <ProfileList
          profiles={profiles}
          onEdit={handleEditProfile}
          onDelete={handleDeleteProfile}
        />
      </div>
    </div>
  );
};

export default ProfileRegistration;
