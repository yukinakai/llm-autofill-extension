/// <reference types="chrome"/>

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
function findLabel(input: HTMLInputElement) {
  // idに関連付けられたラベルを探す
  if (input.id) {
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label) {
      return label.textContent?.trim();
    }
  }

  // 親要素内のラベルを探す
  const parent = input.parentElement;
  if (parent) {
    const label = parent.querySelector('label');
    if (label) {
      return label.textContent?.trim();
    }
  }

  return undefined;
}

// APIキーを取得する関数
async function getApiKey() {
  return new Promise<{ key: string; type: string } | null>((resolve) => {
    chrome.storage.sync.get(['apiKey', 'apiType'], (result) => {
      if (result.apiKey && result.apiType) {
        resolve({ key: result.apiKey, type: result.apiType });
      } else {
        resolve(null);
      }
    });
  });
}

// プロフィール情報を取得する関数
async function getProfile() {
  return new Promise<any>((resolve) => {
    chrome.storage.sync.get(['profile'], (result) => {
      resolve(result.profile || null);
    });
  });
}

// LLMサービス
class LLMService {
  constructor(private _apiKey: string) {
    // 将来的にLLMサービスの初期化に使用する
    console.log('LLMサービスを初期化:', this._apiKey);
  }

  async matchFieldWithProfile(field: { name: string; type: string; label?: string }, profile: any) {
    // TODO: 実際のLLMサービスの実装
    // 現在はモックの実装
    return {
      value: profile[field.name] || '',
      confidence: 0.8
    };
  }
}

// オートフィル機能の実装
async function autofillForms() {
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
      console.error('プロフィール情報が設定されていません');
      return;
    }

    // フォームフィールドを検出
    const fields = detectForms();
    if (fields.length === 0) {
      console.log('フォームフィールドが見つかりませんでした');
      return;
    }

    // LLMサービスを初期化
    const llmService = new LLMService(apiKeyData.key);

    // 各フィールドに対してLLMを使用して最適な値を取得
    for (const field of fields) {
      try {
        const result = await llmService.matchFieldWithProfile(field, profile);
        if (result.value && result.confidence > 0.7) {
          // 確信度が70%以上の場合のみ自動入力
          const input = document.querySelector(`input[name="${field.name}"]`) as HTMLInputElement;
          if (input) {
            input.value = result.value;
            console.log(`フィールド "${field.name}" に "${result.value}" を設定しました（確信度: ${result.confidence}）`);
          }
        }
      } catch (error) {
        console.error(`フィールド "${field.name}" の処理中にエラーが発生しました:`, error);
      }
    }
  } catch (error) {
    console.error('オートフィル処理中にエラーが発生しました:', error);
  }
}

// メッセージリスナーを設定
console.log('Content script loaded');
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('メッセージを受信しました:', message);
  if (message.action === 'autofill') {
    console.log('オートフィルを開始します');
    autofillForms().then(() => {
      console.log('オートフィルが完了しました');
      sendResponse({ success: true });
    }).catch((error) => {
      console.error('オートフィルでエラーが発生しました:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // 非同期レスポンスを示すために true を返す
  }
});
