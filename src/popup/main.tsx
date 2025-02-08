import { createRoot } from 'react-dom/client';
import React, { useState } from 'react';
import './index.css';

const App = () => {
  const [error, setError] = useState<string | null>(null);

  const handleAutofill = async () => {
    console.log('自動入力を開始します');
    try {
      setError(null);

      // 現在のタブを取得
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log('現在のタブ:', tab);

      if (!tab.id) {
        console.error('タブIDが見つかりません');
        throw new Error('タブIDが見つかりません');
      }

      // コンテンツスクリプトにメッセージを送信
      console.log('コンテンツスクリプトにメッセージを送信します');
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'autofill' });
        console.log('メッセージ送信の結果:', response);
      } catch (error) {
        console.error('メッセージ送信中にエラーが発生しました:', error);
        // ページをリロード
        await chrome.tabs.reload(tab.id);
        // リロードが完了するまで待機
        await new Promise(resolve => setTimeout(resolve, 1000));
        // 再度メッセージを送信
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'autofill' });
        console.log('メッセージ再送信の結果:', response);
      }
    } catch (error) {
      console.error('エラーが発生しました:', error);
      setError(error instanceof Error ? error.message : '予期せぬエラーが発生しました');
    }
  };

  return (
    <div className="p-4 min-w-[300px]">
      <h1 className="text-xl font-bold mb-4">LLM Autofill</h1>
      <button
        onClick={handleAutofill}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
      >
        フォームを自動入力
      </button>
      {error && (
        <div className="mt-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      <div className="mt-4 text-sm text-gray-600">
        <p>※ APIキーとプロフィール情報の設定が必要です</p>
        <a
          href="options.html"
          target="_blank"
          className="text-blue-500 hover:text-blue-600"
        >
          設定ページを開く
        </a>
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
