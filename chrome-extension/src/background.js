// Background script for PromptInSTYL Chrome Extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('PromptInSTYL extension installed');
  
  // Create context menu item
  chrome.contextMenus.create({
    id: 'promptinstyl-quick',
    title: 'Generate prompt with PromptInSTYL',
    contexts: ['selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'promptinstyl-quick') {
    // Store selected text for the popup
    chrome.storage.local.set({
      selectedText: info.selectionText
    });
    
    // Open popup or focus existing one
    chrome.action.openPopup();
  }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === 'quick-prompt') {
    chrome.action.openPopup();
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openPopup') {
    chrome.action.openPopup();
    sendResponse({ success: true });
  }
});

// Keep service worker alive
chrome.runtime.onStartup.addListener(() => {
  console.log('PromptInSTYL extension started');
});
