/// <reference types="chrome"/>

// Background script
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

// タブが更新されたときにコンテンツスクリプトを注入
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.startsWith('http')) {
    console.log('タブが更新されました:', tab.url);
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js']
      });
      console.log('コンテンツスクリプトを注入しました');
    } catch (error) {
      console.error('コンテンツスクリプトの注入に失敗しました:', error);
    }
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('Background: メッセージを受信しました:', message);

  if (message.action === 'callAnthropicAPI') {
    const { apiKey, prompt } = message;
    
    console.log('Background: API リクエストを送信します:', {
      url: 'https://api.anthropic.com/v1/messages',
      apiKeyLength: apiKey.length,
    });

    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    })
    .then(async response => {
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Background: APIレスポンスエラー:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorText}`);
      }
      const data = await response.json();
      console.log('Background: APIレスポンス:', data);

      // Claude 3のレスポンス構造に対応
      if (!data.content || !Array.isArray(data.content) || data.content.length === 0) {
        throw new Error('Invalid API response: content is missing or invalid');
      }

      const content = data.content[0].text;
      if (typeof content !== 'string') {
        throw new Error('Invalid API response: content is not a string');
      }

      sendResponse({ success: true, content: content });
    })
    .catch(error => {
      console.error('Background: API呼び出しに失敗しました:', error);
      sendResponse({ success: false, error: error.message });
    });

    return true; // 非同期レスポンスを示す
  }
});
