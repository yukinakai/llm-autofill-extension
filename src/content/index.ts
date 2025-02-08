/// <reference types="chrome"/>

export {};

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
    autofillForms: () => Promise<void>;
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
    private apiKey: string;
    private provider: string;

    constructor(apiKey: string, provider: string) {
      this.apiKey = apiKey;
      this.provider = provider;
    }

    async matchFieldWithProfile(
      field: { name: string; type: string; label?: string },
      profile: Record<string, string>
    ): Promise<string> {
      try {
        const prompt = `フィールド名: ${field.name}
タイプ: ${field.type}
${field.label ? `ラベル: ${field.label}` : ''}
プロフィール: ${JSON.stringify(profile, null, 2)}

上記のフォームフィールドに対して、プロフィールから最適な値を選択してください。`;

        const response = await this.callClaudeAPI(prompt);
        return response.trim();
      } catch (error) {
        console.error('フィールドのマッチングに失敗しました:', error);
        throw error;
      }
    }

    async callClaudeAPI(prompt: string): Promise<string> {
      if (this.provider !== 'claude') {
        throw new Error("Unsupported LLM provider");
      }

      try {
        const response = await fetch('https://api.claude.ai/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'claude-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude',
            max_tokens: 1000,
            messages: [{ role: 'user', content: prompt }]
          })
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.content;
      } catch (error) {
        console.error('API呼び出しに失敗しました:', error);
        throw error;
      }
    }
  }

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

      if (fields.length === 0) {
        console.log('入力可能なフォームフィールドが見つかりませんでした');
        return;
      }

      // LLMサービスを初期化
      const llmService = new LLMService(apiKeyData.key, apiKeyData.type);

      // 各フィールドに対してマッチング処理を実行
      for (const field of fields) {
        try {
          const value = await llmService.matchFieldWithProfile(field, profile);
          if (value) {
            // フィールドを特定して値を設定
            const input = document.querySelector(`input[name="${field.name}"]`) as HTMLInputElement;
            if (input) {
              input.value = value;
              // 入力イベントを発火させて、フォームのバリデーションなどを実行
              const event = new Event('input', { bubbles: true });
              input.dispatchEvent(event);
              console.log(`フィールド "${field.name}" に "${value}" を設定しました`);
            }
          }
        } catch (error) {
          console.error(`フィールド "${field.name}" の自動入力に失敗しました:`, error);
        }
      }

      console.log('フォームの自動入力が完了しました');
    } catch (error) {
      console.error('フォームの自動入力中にエラーが発生しました:', error);
    }
  }

  // グローバルオブジェクトに関数を追加
  window.detectForms = detectForms;
  window.findLabel = findLabel;
  window.LLMService = LLMService;
  window.getApiKey = getApiKey;
  window.getProfile = getProfile;
  window.autofillForms = autofillForms;

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
