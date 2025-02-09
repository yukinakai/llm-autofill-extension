import { detectForms } from './formDetector';
import { LLMService } from '../services/llmService';
import { getApiKey, getProfile } from '../utils/storage';

export async function autofillForms() {
  try {
    // APIキーを取得
    const apiKeyData = await getApiKey();
    if (!apiKeyData) {
      throw new Error('APIキーが設定されていません');
    }

    // プロフィール情報を取得
    const profile = await getProfile();
    if (!profile) {
      throw new Error('プロフィール情報が設定されていません');
    }

    // フォームフィールドを検出
    const fields = detectForms();
    if (fields.length === 0) {
      throw new Error('フォームフィールドが見つかりませんでした');
    }

    // LLMサービスを初期化
    const llmService = new LLMService(apiKeyData.key);

    // 進捗状況を表示するUIを作成
    const progressContainer = createProgressUI();
    const progressBar = progressContainer.querySelector('.progress-bar') as HTMLDivElement;
    const progressText = progressContainer.querySelector('.progress-text') as HTMLDivElement;

    // 各フィールドに対してLLMを使用して最適な値を取得
    const totalFields = fields.length;
    let completedFields = 0;
    let successCount = 0;

    for (const field of fields) {
      try {
        // 進捗状況を更新
        updateProgress(progressBar, progressText, completedFields, totalFields);

        const result = await llmService.matchFieldWithProfile(field, profile);
        if (result.value && result.confidence > 0.5) {
          const input = document.querySelector(`input[name="${field.name}"]`) as HTMLInputElement;
          if (input) {
            input.value = result.value;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            successCount++;
            console.log(`フィールド "${field.name}" に "${result.value}" を設定しました（確信度: ${result.confidence}）`);
          }
        } else {
          console.warn(`フィールド "${field.name}" は低い確信度（${result.confidence}）のため、スキップしました`);
        }
      } catch (error) {
        console.error(`フィールド "${field.name}" の処理中にエラーが発生しました:`, error);
      } finally {
        completedFields++;
      }
    }

    // 完了メッセージを表示
    showCompletionMessage(progressContainer, successCount, totalFields);

    // 3秒後にUIを削除
    setTimeout(() => {
      document.body.removeChild(progressContainer);
    }, 3000);

  } catch (error) {
    showError(error instanceof Error ? error.message : '不明なエラーが発生しました');
  }
}

function createProgressUI(): HTMLDivElement {
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    z-index: 10000;
    min-width: 250px;
  `;

  const progressBar = document.createElement('div');
  progressBar.className = 'progress-bar';
  progressBar.style.cssText = `
    width: 100%;
    height: 4px;
    background: #eee;
    border-radius: 2px;
    overflow: hidden;
  `;

  const progressInner = document.createElement('div');
  progressInner.style.cssText = `
    width: 0%;
    height: 100%;
    background: #4CAF50;
    transition: width 0.3s ease;
  `;
  progressBar.appendChild(progressInner);

  const progressText = document.createElement('div');
  progressText.className = 'progress-text';
  progressText.style.cssText = `
    margin-top: 8px;
    font-size: 12px;
    color: #666;
  `;

  container.appendChild(progressBar);
  container.appendChild(progressText);
  document.body.appendChild(container);

  return container;
}

function updateProgress(
  progressBar: HTMLDivElement,
  progressText: HTMLDivElement,
  completed: number,
  total: number
) {
  const percent = Math.round((completed / total) * 100);
  const progressInner = progressBar.firstChild as HTMLDivElement;
  progressInner.style.width = `${percent}%`;
  progressText.textContent = `処理中... ${completed}/${total} フィールド完了`;
}

function showCompletionMessage(
  container: HTMLDivElement,
  successCount: number,
  totalFields: number
) {
  const progressText = container.querySelector('.progress-text') as HTMLDivElement;
  const progressBar = container.querySelector('.progress-bar') as HTMLDivElement;
  const progressInner = progressBar.firstChild as HTMLDivElement;
  progressInner.style.background = '#4CAF50';
  progressText.textContent = `完了: ${successCount}/${totalFields} フィールドを自動入力しました`;
}

function showError(message: string) {
  const errorContainer = document.createElement('div');
  errorContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #f44336;
    color: white;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    z-index: 10000;
    max-width: 300px;
  `;
  errorContainer.textContent = message;

  document.body.appendChild(errorContainer);
  setTimeout(() => {
    document.body.removeChild(errorContainer);
  }, 5000);
}

// ページ読み込み完了時の処理
document.addEventListener('DOMContentLoaded', () => {
  // オートフィルボタンを追加
  const button = document.createElement('button');
  button.textContent = 'オートフィル実行';
  button.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    padding: 8px 16px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    z-index: 10000;
    transition: background-color 0.3s;
  `;
  button.addEventListener('mouseover', () => {
    button.style.backgroundColor = '#45a049';
  });
  button.addEventListener('mouseout', () => {
    button.style.backgroundColor = '#4CAF50';
  });
  button.addEventListener('click', autofillForms);
  document.body.appendChild(button);
});
