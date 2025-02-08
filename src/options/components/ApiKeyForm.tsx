import React, { useState, useEffect } from 'react';
import {
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

type LLMProvider = 'openai' | 'gemini' | 'claude';

interface ApiKey {
  provider: LLMProvider;
  key: string;
  timestamp: string;
}

interface ApiKeyFormProps {
  onSubmit: (apiKey: ApiKey | null) => void;
}

const ApiKeyForm: React.FC<ApiKeyFormProps> = ({ onSubmit }) => {
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider>('openai');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [savedApiKey, setSavedApiKey] = useState<ApiKey | null>(null);

  const validateApiKey = (key: string, provider: LLMProvider): boolean => {
    if (!key) {
      setError('APIキーを入力してください');
      return false;
    }

    switch (provider) {
      case 'openai':
        if (!key.startsWith('sk-')) {
          setError('OpenAIのAPIキーは"sk-"で始まる必要があります');
          return false;
        }
        break;
      case 'gemini':
        if (!key.startsWith('AIzaSy')) {
          setError('GeminiのAPIキーは"AIzaSy"で始まる必要があります');
          return false;
        }
        break;
      case 'claude':
        if (!key.startsWith('sk-ant-')) {
          setError('ClaudeのAPIキーは"sk-ant-"で始まる必要があります');
          return false;
        }
        break;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateApiKey(apiKey, selectedProvider)) {
      const newApiKey: ApiKey = {
        provider: selectedProvider,
        key: apiKey,
        timestamp: new Date().toLocaleString('ja-JP'),
      };
      setSavedApiKey(newApiKey);
      onSubmit(newApiKey);
      setApiKey('');
      setError('');
    }
  };

  const handleDelete = () => {
    setSavedApiKey(null);
    onSubmit(null);
  };

  return (
    <Paper className="p-4">
      <form onSubmit={handleSubmit} aria-label="api-key-form" className="space-y-4">
        {savedApiKey ? (
          <div className="mb-4 p-4 bg-gray-50 rounded">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="subtitle1" component="h3" className="font-semibold">
                  登録済みのAPIキー
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  プロバイダー: {savedApiKey.provider === 'openai' ? 'OpenAI' : savedApiKey.provider === 'gemini' ? 'Gemini' : 'Claude'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  登録日時: {savedApiKey.timestamp}
                </Typography>
              </div>
              <IconButton onClick={handleDelete} color="error" aria-label="APIキーを削除">
                <DeleteIcon />
              </IconButton>
            </div>
          </div>
        ) : (
          <>
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
          </>
        )}
      </form>
    </Paper>
  );
};

export default ApiKeyForm;
