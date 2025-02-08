import React, { useState } from 'react';
import { TextField, Button, Paper, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

type LLMProvider = 'openai' | 'gemini' | 'claude';

interface ApiKeys {
  openAiKey: string;
  geminiKey: string;
  claudeKey: string;
}

interface ApiKeyFormProps {
  onSubmit?: (apiKeys: ApiKeys) => void;
}

const ApiKeyForm: React.FC<ApiKeyFormProps> = ({ onSubmit }) => {
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider>('openai');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [savedKeys, setSavedKeys] = useState<ApiKeys>({
    openAiKey: '',
    geminiKey: '',
    claudeKey: '',
  });

  const validateApiKey = (key: string, provider: LLMProvider): boolean => {
    switch (provider) {
      case 'openai':
        return key.startsWith('sk-') && key.length >= 32;
      case 'gemini':
        return key.length === 39;
      case 'claude':
        return key.startsWith('sk-') && key.length >= 40;
      default:
        return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey) {
      setError('APIキーを入力してください');
      return;
    }

    if (!validateApiKey(apiKey, selectedProvider)) {
      setError('無効なAPIキーの形式です');
      return;
    }

    const newKeys = {
      ...savedKeys,
      [selectedProvider === 'openai' ? 'openAiKey' : selectedProvider === 'gemini' ? 'geminiKey' : 'claudeKey']: apiKey,
    };

    setSavedKeys(newKeys);
    if (onSubmit) {
      onSubmit(newKeys);
    }
    setApiKey('');
    setError('');
  };

  return (
    <Paper className="p-4">
      <form onSubmit={handleSubmit} aria-label="api-key-form" className="space-y-4">
        <FormControl fullWidth>
          <InputLabel id="llm-provider-label" htmlFor="llm-provider-select">LLMプロバイダー</InputLabel>
          <Select
            id="llm-provider-select"
            labelId="llm-provider-label"
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value as LLMProvider)}
            label="LLMプロバイダー"
          >
            <MenuItem value="openai">OpenAI</MenuItem>
            <MenuItem value="gemini">Gemini</MenuItem>
            <MenuItem value="claude">Claude</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          type="password"
          label={`${selectedProvider === 'openai' ? 'OpenAI' : selectedProvider === 'gemini' ? 'Gemini' : 'Claude'} APIキー`}
          value={apiKey}
          onChange={(e) => {
            setApiKey(e.target.value);
            setError('');
          }}
          error={!!error}
          helperText={error}
        />

        <div className="flex justify-end">
          <Button type="submit" variant="contained" color="primary">
            保存
          </Button>
        </div>

        {/* 保存済みのAPIキー一覧 */}
        {Object.entries(savedKeys).some(([_, value]) => value) && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">設定済みのAPIキー</h3>
            <ul className="space-y-2">
              {savedKeys.openAiKey && (
                <li>OpenAI: {savedKeys.openAiKey.replace(/./g, '•')}</li>
              )}
              {savedKeys.geminiKey && (
                <li>Gemini: {savedKeys.geminiKey.replace(/./g, '•')}</li>
              )}
              {savedKeys.claudeKey && (
                <li>Claude: {savedKeys.claudeKey.replace(/./g, '•')}</li>
              )}
            </ul>
          </div>
        )}
      </form>
    </Paper>
  );
};

export default ApiKeyForm;
