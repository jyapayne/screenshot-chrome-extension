// Background service worker for Full Screenshot Selector Chrome Extension

// Handle keyboard shortcut
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'activate-selector') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
      try {
        await chrome.tabs.sendMessage(tab.id, { action: 'activateFromShortcut' });
      } catch (error) {
        console.log('Could not activate selector on this page:', error);
      }
    }
  }
});

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Full Screenshot Selector installed');
  }
});