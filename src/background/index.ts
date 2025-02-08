/// <reference types="chrome"/>

// Background script
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});
