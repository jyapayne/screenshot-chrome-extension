// Background service worker for Full Screenshot Selector Chrome Extension

// Handle keyboard shortcut
chrome.commands.onCommand.addListener(async (command) => {
  console.log('Command received:', command);
  if (command === 'activate-selector') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (
      tab &&
      tab.url &&
      !tab.url.startsWith('chrome://') &&
      !tab.url.startsWith('chrome-extension://') &&
      !tab.url.startsWith('edge://') &&
      !tab.url.startsWith('about:') &&
      tab.url !== 'chrome://newtab/' &&
      tab.url !== 'edge://newtab/'
    ) {
      try {
        await chrome.tabs.sendMessage(tab.id, { action: 'activateFromShortcut' });
      } catch (error) {
        console.log(
          'Could not activate selector on this page:',
          error && error.message ? error.message : error
        );
      }
    }
  }
});

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Full Screenshot Selector installed');
  }
  // Log available commands and their current shortcuts to help debug
  chrome.commands.getAll((commands) => {
    console.log('Registered commands:', commands);
  });
});

// Also log commands on service worker startup (in case it wakes up later)
chrome.runtime.onStartup?.addListener(() => {
  chrome.commands.getAll((commands) => {
    console.log('Registered commands (onStartup):', commands);
  });
});