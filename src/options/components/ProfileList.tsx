import React, { useState } from 'react';
import { Profile } from './ProfileRegistration';
import ProfileForm from './ProfileForm';

type ProfileListProps = {
  profiles: Profile[];
  onEdit: (id: string, fields: { name: string; value: string }[]) => void;
  onDelete: (id: string) => void;
};

const ProfileList: React.FC<ProfileListProps> = ({ profiles, onEdit, onDelete }) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleEdit = (id: string) => {
    setEditingId(id);
  };

  const handleSave = (id: string, fields: { name: string; value: string }[]) => {
    onEdit(id, fields);
    setEditingId(null);
  };

  if (profiles.length === 0) {
    return (
      <div className="text-gray-500 text-center py-4">
        登録済みのプロフィールはありません
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {profiles.map((profile: Profile) => (
        <div key={profile.id} className="border rounded-lg p-4">
          {editingId === profile.id ? (
            <div className="space-y-4">
              <h3 className="font-semibold">プロフィールの編集</h3>
              <ProfileForm
                initialFields={profile.fields}
                onSave={(fields) => handleSave(profile.id, fields)}
              />
              <button
                onClick={() => setEditingId(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                キャンセル
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                {profile.fields.map((field, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="font-medium w-1/3">{field.name}</div>
                    <div className="w-2/3">{field.value}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => handleEdit(profile.id)}
                  className="px-4 py-2 text-blue-600 hover:text-blue-800"
                >
                  編集
                </button>
                <button
                  onClick={() => onDelete(profile.id)}
                  className="px-4 py-2 text-red-600 hover:text-red-800"
                >
                  削除
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ProfileList;
