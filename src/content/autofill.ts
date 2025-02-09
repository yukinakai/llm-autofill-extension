import { detectForms } from './formDetector';
import { LLMService } from '../services/llmService';
import { getApiKey, getProfile } from '../utils/storage';

export async function autofillForms() {
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
        if (result.value && result.confidence > 0.9) {
          // 確信度が90%以上の場合のみ自動入力
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

// ページ読み込み完了時の処理
document.addEventListener('DOMContentLoaded', () => {
  // オートフィルボタンを追加
  const button = document.createElement('button');
  button.textContent = 'オートフィル実行';
  button.style.position = 'fixed';
  button.style.top = '10px';
  button.style.right = '10px';
  button.style.zIndex = '10000';
  button.addEventListener('click', autofillForms);
  document.body.appendChild(button);
});
