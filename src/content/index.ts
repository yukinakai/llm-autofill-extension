/// <reference types="chrome"/>

declare global {
  interface Window {
    detectForms: () => { name: string; type: string; label?: string }[];
    findLabel: (input: HTMLInputElement) => string | undefined;
    LLMService: new (apiKey: string, provider: string) => {
      matchFieldWithProfile: (
        field: { name: string; type: string; label?: string },
        profile: Record<string, string>
      ) => Promise<string>;
    };
    getApiKey: () => Promise<{ key: string; type: string } | null>;
    getProfile: () => Promise<Record<string, string> | null>;
  }
}

(function() {
  const StorageKey = {
    ApiKey: 'llm_api_key',
    Profile: 'user_profile'
  };

  // フォーム検出のロジック
  function detectForms() {
    const forms = document.querySelectorAll('form');
    const fields: { name: string; type: string; label?: string }[] = [];

    forms.forEach(form => {
      const inputs = form.querySelectorAll('input');
      inputs.forEach(input => {
        if (input.type !== 'submit' && input.type !== 'button' && input.type !== 'hidden') {
          const field = {
            name: input.name || input.id,
            type: input.type,
            label: findLabel(input)
          };
          fields.push(field);
        }
      });
    });

    return fields;
  }

  // ラベルを見つける関数
  function findLabel(input: HTMLInputElement): string | undefined {
    // idに関連付けられたラベルを探す
    if (input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label) {
        return label.textContent?.trim();
      }
    }

    // 親要素内のラベルを探す
    let parent = input.parentElement;
    while (parent) {
      const label = parent.querySelector('label');
      if (label) {
        return label.textContent?.trim();
      }
      parent = parent.parentElement;
    }

    return undefined;
  }

  interface ApiKey {
    provider: string;
    key: string;
    timestamp: string;
  }

  // APIキーを取得する関数
  async function getApiKey(): Promise<{ key: string; type: string } | null> {
    return new Promise((resolve) => {
      chrome.storage.sync.get([StorageKey.ApiKey], (result) => {
        const apiKey: ApiKey | undefined = result[StorageKey.ApiKey];
        if (apiKey?.key && apiKey?.provider) {
          resolve({
            key: apiKey.key,
            type: apiKey.provider
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  // プロフィール情報を取得する関数
  async function getProfile(): Promise<Record<string, string> | null> {
    return new Promise((resolve) => {
      chrome.storage.sync.get([StorageKey.Profile], (result) => {
        resolve(result[StorageKey.Profile] || null);
      });
    });
  }

  // LLMサービス
  class LLMService {
    private _apiKey: string;
    private _provider: string;

    constructor(apiKey: string, provider: string) {
      this._apiKey = apiKey;
      this._provider = provider;
      console.log('LLMサービスを初期化:', this._provider);
    }

    private async callAnthropicAPI(prompt: string): Promise<string> {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this._apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-opus-20240229',
            max_tokens: 1024,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ]
          })
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        return data.content[0].text;
      } catch (error) {
        console.error('API呼び出しに失敗しました:', error);
        throw error;
      }
    }

    async matchFieldWithProfile(
      field: { name: string; type: string; label?: string },
      profile: Record<string, string>
    ): Promise<string> {
      try {
        // プロフィールのキーと値のペアを文字列に変換
        const profileStr = Object.entries(profile)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');

        // プロンプトを構築
        const prompt = `
フォームフィールドとプロフィール情報を照合してください。

フォームフィールド:
- 名前: ${field.name}
- タイプ: ${field.type}
- ラベル: ${field.label || '不明'}

プロフィール情報:
${profileStr}

フォームフィールドに最も適切なプロフィール情報の値を選んでください。
プロフィール情報に適切な値が見つからない場合は空文字を返してください。
値のみを返してください。説明は不要です。`;

        // APIを呼び出してマッチング
        const result = await this.callAnthropicAPI(prompt);
        return result.trim();
      } catch (error) {
        console.error('フィールドのマッチングに失敗しました:', error);
        return '';
      }
    }
  }

  // グローバルオブジェクトに関数を追加
  window.detectForms = detectForms;
  window.findLabel = findLabel;
  window.LLMService = LLMService;
  window.getApiKey = getApiKey;
  window.getProfile = getProfile;

  // オートフィル機能の実装
  async function autofillForms() {
    console.log('フォームの自動入力を開始します');

    try {
      // APIキーを取得
      const apiKeyData = await getApiKey();
      if (!apiKeyData) {
        console.error('APIキーが設定されていません');
        return;
      }

      // プロフィール情報を取得
      const profile = await getProfile();
      if (!profile) {
        console.error('プロフィールが設定されていません');
        return;
      }

      // フォームフィールドを検出
      const fields = detectForms();
      console.log('検出されたフィールド:', fields);

      // LLMサービスを初期化
      const llmService = new LLMService(apiKeyData.key, apiKeyData.type);

      // 各フィールドに対して自動入力を実行
      for (const field of fields) {
        const value = await llmService.matchFieldWithProfile(field, profile);
        if (value) {
          const input = document.querySelector(`input[name="${field.name}"], input[id="${field.name}"]`) as HTMLInputElement | null;
          if (input) {
            input.value = value;
            console.log(`フィールド ${field.name} に ${value} を入力しました`);
          }
        }
      }

      console.log('フォームの自動入力が完了しました');
    } catch (error) {
      console.error('フォームの自動入力中にエラーが発生しました:', error);
    }
  }

  // メッセージリスナーを設定
  console.log('Content script loaded');
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    console.log('メッセージを受信しました:', message);
    if (message.action === 'autofill') {
      autofillForms().then(() => {
        sendResponse({ success: true });
      }).catch((error) => {
        console.error('Error:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true; // 非同期レスポンスを示す
    }
  });

  // テスト用に関数をグローバルに公開
  if (process.env.NODE_ENV === 'test') {
    window.detectForms = detectForms;
    window.findLabel = findLabel;
    window.LLMService = LLMService;
    window.getApiKey = getApiKey;
    window.getProfile = getProfile;
  }
})();
