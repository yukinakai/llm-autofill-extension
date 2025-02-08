import React, { useState, useEffect } from 'react';
import { Paper, TextField, Button, Select, MenuItem, FormControl, InputLabel, CircularProgress, Alert, SelectChangeEvent } from '@mui/material';
import { getApiKey, saveApiKey, deleteApiKey } from '../../utils/storage';

export interface ApiKey {
  key: string;
  provider: 'openai' | 'claude';
  timestamp?: string;
}

const ApiKeyForm: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState<'openai' | 'claude'>('openai');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedApiKey, setSavedApiKey] = useState<ApiKey | null>(null);

  useEffect(() => {
    loadApiKey();
  }, []);

  const loadApiKey = async () => {
    try {
      const savedKey = await getApiKey();
      setSavedApiKey(savedKey);
      setLoading(false);
    } catch (error) {
      console.error('APIキーの読み込みに失敗しました:', error);
      setError('APIキーの読み込みに失敗しました');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // APIキーの形式を検証
    if (provider === 'openai' && !apiKey.startsWith('sk-')) {
      setError('APIキーの形式が正しくありません');
      return;
    }

    try {
      await saveApiKey({
        key: apiKey,
        provider,
        timestamp: new Date().toLocaleString('ja-JP', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }).replace(/\//g, '/').replace(/,/, '')
      });

      // 保存したAPIキーを再読み込み
      await loadApiKey();
      setApiKey('');
    } catch (error) {
      console.error('APIキーの保存に失敗しました:', error);
      setError('APIキーの保存に失敗しました');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteApiKey();
      setSavedApiKey(null);
    } catch (error) {
      console.error('APIキーの削除に失敗しました:', error);
      setError('APIキーの削除に失敗しました');
    }
  };

  const handleProviderChange = (event: SelectChangeEvent<"openai" | "claude">) => {
    setProvider(event.target.value as "openai" | "claude");
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
  };

  if (loading) {
    return (
      <Paper className="p-4">
        <div className="flex justify-center items-center">
          <CircularProgress />
          <span className="ml-2">読み込み中...</span>
        </div>
      </Paper>
    );
  }

  return (
    <Paper className="p-4">
      <form onSubmit={handleSubmit} aria-label="api-key-form" className="space-y-4">
        <FormControl fullWidth>
          <InputLabel id="llm-provider-label">LLMプロバイダー</InputLabel>
          <Select
            labelId="llm-provider-label"
            id="llm-provider-select"
            value={provider}
            label="LLMプロバイダー"
            onChange={handleProviderChange}
            data-testid="llm-provider-select"
          >
            <MenuItem value="openai">OpenAI</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="OpenAI APIキー"
          type="password"
          value={apiKey}
          onChange={handleApiKeyChange}
          error={!!error}
          helperText={error}
          data-testid="api-key-input"
        />

        {error && (
          <Alert severity="error" className="mt-4">
            {error}
          </Alert>
        )}

        {savedApiKey && (
          <div className="mt-4">
            <p>保存日時: {savedApiKey.timestamp}</p>
            <Button
              variant="outlined"
              color="error"
              onClick={handleDelete}
              className="mt-2"
            >
              削除
            </Button>
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" variant="contained" color="primary">
            保存
          </Button>
        </div>
      </form>
    </Paper>
  );
};

export default ApiKeyForm;
