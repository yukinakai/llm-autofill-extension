import React, { useState } from 'react';

type Field = {
  name: string;
  value: string;
};

type ProfileFormProps = {
  initialFields?: Field[];
  onSave: (fields: Field[]) => void;
};

const ProfileForm: React.FC<ProfileFormProps> = ({ initialFields = [], onSave }) => {
  const [fields, setFields] = useState<Field[]>(initialFields.length > 0 ? initialFields : [{ name: '', value: '' }]);

  const handleAddField = () => {
    setFields([...fields, { name: '', value: '' }]);
  };

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, key: keyof Field, value: string) => {
    const newFields = fields.map((field, i) =>
      i === index ? { ...field, [key]: value } : field
    );
    setFields(newFields);
  };

  const resetForm = () => {
    setFields([{ name: '', value: '' }]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validFields = fields.filter(field => field.name && field.value);
    if (validFields.length > 0) {
      onSave(validFields);
      if (initialFields?.length === 0 || !initialFields) {
        resetForm();
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map((field, index) => (
        <div key={index} className="flex gap-4 items-start">
          <div className="flex-1">
            <input
              type="text"
              placeholder="項目名"
              value={field.name}
              onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div className="flex-1">
            <input
              type="text"
              placeholder="値"
              value={field.value}
              onChange={(e) => handleFieldChange(index, 'value', e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <button
            type="button"
            onClick={() => handleRemoveField(index)}
            className="px-3 py-2 text-red-600 hover:text-red-800"
            disabled={fields.length === 1}
          >
            削除
          </button>
        </div>
      ))}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={handleAddField}
          className="px-4 py-2 text-blue-600 hover:text-blue-800"
        >
          項目を追加
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          保存
        </button>
      </div>
    </form>
  );
};

export default ProfileForm;
