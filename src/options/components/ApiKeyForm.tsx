import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
} from '@mui/material';

interface ApiKeys {
  openAiKey: string;
  geminiKey: string;
  claudeKey: string;
}

interface ApiKeyFormProps {
  onSubmit?: (apiKeys: ApiKeys) => void;
}

const ApiKeyForm: React.FC<ApiKeyFormProps> = ({ onSubmit }) => {
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    openAiKey: '',
    geminiKey: '',
    claudeKey: '',
  });

  const [errors, setErrors] = useState<Partial<ApiKeys>>({});

  const validateApiKey = (key: string, provider: keyof ApiKeys): boolean => {
    if (!key) return true; // 空の場合はエラーとしない

    // プロバイダーごとの検証ルール
    const rules = {
      openAiKey: /^sk-[a-zA-Z0-9]{32,}$/,
      geminiKey: /^[a-zA-Z0-9-]{39}$/,
      claudeKey: /^sk-[a-zA-Z0-9]{40,}$/,
    };

    return rules[provider].test(key);
  };

  const handleChange = (provider: keyof ApiKeys) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setApiKeys((prev) => ({ ...prev, [provider]: value }));
    
    // バリデーションエラーをクリア
    if (errors[provider]) {
      setErrors((prev) => ({ ...prev, [provider]: undefined }));
    }
  };

  const handleBlur = (provider: keyof ApiKeys) => () => {
    const value = apiKeys[provider];
    if (value && !validateApiKey(value, provider)) {
      setErrors((prev) => ({
        ...prev,
        [provider]: '無効なAPIキーの形式です',
      }));
    }
  };

  const validateAndSubmit = () => {
    // 全フィールドのバリデーション
    const newErrors: Partial<ApiKeys> = {};
    (Object.keys(apiKeys) as Array<keyof ApiKeys>).forEach((provider) => {
      if (apiKeys[provider] && !validateApiKey(apiKeys[provider], provider)) {
        newErrors[provider] = '無効なAPIキーの形式です';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }

    if (onSubmit) {
      onSubmit(apiKeys);
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted');
    console.log('Current API Keys:', apiKeys);
    if (onSubmit) {
      onSubmit(apiKeys);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        API キー設定
      </Typography>
      <form onSubmit={handleSubmit} aria-label="api-key-form">
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="OpenAI API Key"
            value={apiKeys.openAiKey}
            onChange={handleChange('openAiKey')}
            onBlur={handleBlur('openAiKey')}
            error={!!errors.openAiKey}
            helperText={errors.openAiKey || 'OpenAIのAPIキーを入力してください'}
            type="password"
            margin="normal"
          />
        </Box>

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Gemini API Key"
            value={apiKeys.geminiKey}
            onChange={handleChange('geminiKey')}
            onBlur={handleBlur('geminiKey')}
            error={!!errors.geminiKey}
            helperText={errors.geminiKey || 'GeminiのAPIキーを入力してください'}
            type="password"
            margin="normal"
          />
        </Box>

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Claude API Key"
            value={apiKeys.claudeKey}
            onChange={handleChange('claudeKey')}
            onBlur={handleBlur('claudeKey')}
            error={!!errors.claudeKey}
            helperText={errors.claudeKey || 'ClaudeのAPIキーを入力してください'}
            type="password"
            margin="normal"
          />
        </Box>

        <Box sx={{ mt: 3 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
          >
            保存
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default ApiKeyForm;
