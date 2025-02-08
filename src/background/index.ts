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
