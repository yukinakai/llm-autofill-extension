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
  Alert,
  SelectChangeEvent,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { saveApiKey, loadApiKey, deleteApiKey } from '../../utils/storage';

type LLMProvider = 'openai' | 'gemini' | 'claude';

export interface ApiKey {
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadSavedApiKey = async () => {
      try {
        const key = await loadApiKey();
        if (isMounted) {
          setSavedApiKey(key);
          if (key) {
            onSubmit(key);
          }
          setIsLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          console.error('APIキーの読み込みに失敗しました:', error);
          setError('APIキーの読み込みに失敗しました');
          setIsLoading(false);
        }
      }
    };

    loadSavedApiKey();

    return () => {
      isMounted = false;
    };
  }, [onSubmit]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (validateApiKey(apiKey, selectedProvider)) {
      try {
        const newApiKey: ApiKey = {
          provider: selectedProvider,
          key: apiKey,
          timestamp: new Date().toLocaleString('ja-JP'),
        };
        await saveApiKey(newApiKey);
        setSavedApiKey(newApiKey);
        onSubmit(newApiKey);
        setApiKey('');
      } catch (error) {
        console.error('APIキーの保存に失敗しました:', error);
        setError('APIキーの保存に失敗しました');
      }
    }
  };

  const handleDelete = async () => {
    try {
      await deleteApiKey();
      setSavedApiKey(null);
      onSubmit(null);
    } catch (error) {
      console.error('APIキーの削除に失敗しました:', error);
      setError('APIキーの削除に失敗しました');
    }
  };

  const handleProviderChange = (event: SelectChangeEvent<LLMProvider>) => {
    setSelectedProvider(event.target.value as LLMProvider);
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
    setError('');
  };

  if (isLoading) {
    return (
      <Paper className="p-4">
        <div className="text-center p-4">
          <Typography>読み込み中...</Typography>
        </div>
      </Paper>
    );
  }

  return (
    <Paper className="p-4">
      {error && (
        <Alert severity="error" className="mb-4" data-testid="error-alert">
          {error}
        </Alert>
      )}
      <form aria-label="api-key-form" className="space-y-4" onSubmit={handleSubmit}>
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
              <InputLabel id="llm-provider-label">LLMプロバイダー</InputLabel>
              <Select
                labelId="llm-provider-label"
                id="llm-provider-select"
                value={selectedProvider}
                label="LLMプロバイダー"
                onChange={handleProviderChange}
                aria-label="LLMプロバイダー"
              >
                <MenuItem value="openai">OpenAI</MenuItem>
                <MenuItem value="gemini">Gemini</MenuItem>
                <MenuItem value="claude">Claude</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label={`${selectedProvider === 'openai' ? 'OpenAI' : selectedProvider === 'gemini' ? 'Gemini' : 'Claude'} APIキー`}
              type="password"
              value={apiKey}
              onChange={handleApiKeyChange}
              error={!!error}
              inputProps={{
                'aria-label': `${selectedProvider === 'openai' ? 'OpenAI' : selectedProvider === 'gemini' ? 'Gemini' : 'Claude'} APIキー`,
                role: 'textbox'
              }}
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
