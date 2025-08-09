// Popup script for Chrome extension
document.addEventListener('DOMContentLoaded', async () => {
  const backgroundSelect = document.getElementById('background-select');
  const startBtn = document.getElementById('start-selector');
  const stopBtn = document.getElementById('stop-selector');
  const status = document.getElementById('status');

  // Load saved background preference
  const saved = await chrome.storage.sync.get(['backgroundPreference']);
  if (saved.backgroundPreference) {
    backgroundSelect.value = saved.backgroundPreference;
  }

  // Save background preference when changed
  backgroundSelect.addEventListener('change', () => {
    chrome.storage.sync.set({ backgroundPreference: backgroundSelect.value });
  });

  // Start selector
  startBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Check if page is compatible
    if (tab.url.startsWith('chrome://') ||
        tab.url.startsWith('chrome-extension://') ||
        tab.url.startsWith('edge://') ||
        tab.url.startsWith('about:') ||
        tab.url === 'chrome://newtab/' ||
        tab.url === 'edge://newtab/') {
      showStatus('Error: Cannot capture screenshots on this page type.', 'error');
      return;
    }

    try {
      await chrome.tabs.sendMessage(tab.id, {
        action: 'startSelector',
        background: backgroundSelect.value
      });

      showStatus('Selector activated! Hover over elements and click to capture.', 'success');
      toggleButtons(true);

      // Auto-close popup after starting
      setTimeout(() => window.close(), 1500);

    } catch (error) {
      console.error('Full error details:', error);
      if (error.message.includes('Could not establish connection')) {
        showStatus('Error: Content script not loaded. Try refreshing the page.', 'error');
      } else {
        showStatus('Error: Could not activate on this page.', 'error');
      }
    }
  });

  // Stop selector
  stopBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    try {
      await chrome.tabs.sendMessage(tab.id, { action: 'stopSelector' });
      showStatus('Selector stopped.', 'success');
      toggleButtons(false);
    } catch (error) {
      console.error('Error stopping selector:', error);
    }
  });

  // Check current state
  checkSelectorState();

  function toggleButtons(isActive) {
    if (isActive) {
      startBtn.style.display = 'none';
      stopBtn.style.display = 'block';
    } else {
      startBtn.style.display = 'block';
      stopBtn.style.display = 'none';
    }
  }

  function showStatus(message, type = 'success') {
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';

    setTimeout(() => {
      status.style.display = 'none';
    }, 3000);
  }

  async function checkSelectorState() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Skip check for incompatible pages
    if (tab.url.startsWith('chrome://') ||
        tab.url.startsWith('chrome-extension://') ||
        tab.url.startsWith('edge://') ||
        tab.url.startsWith('about:')) {
      return;
    }

    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'checkState' });
      if (response && response.isActive) {
        toggleButtons(true);
        showStatus('Selector is currently active', 'success');
      }
    } catch (error) {
      // Content script not ready or selector not active
      console.log('Content script not ready or selector inactive:', error.message);
    }
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'selectorStopped') {
    const startBtn = document.getElementById('start-selector');
    const stopBtn = document.getElementById('stop-selector');
    const status = document.getElementById('status');

    startBtn.style.display = 'block';
    stopBtn.style.display = 'none';

    if (message.reason === 'screenshot-taken') {
      status.textContent = 'Screenshot captured!';
      status.className = 'status success';
      status.style.display = 'block';
      setTimeout(() => status.style.display = 'none', 2000);
    }
  }
});