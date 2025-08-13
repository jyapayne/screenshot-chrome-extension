// Popup script for Chrome extension
document.addEventListener('DOMContentLoaded', async () => {
  const backgroundSelect = document.getElementById('background-select');
  const clipboardToggle = document.getElementById('clipboard-toggle');
  const startBtn = document.getElementById('start-selector');
  const stopBtn = document.getElementById('stop-selector');
  const status = document.getElementById('status');

  // Load saved preferences
  const saved = await chrome.storage.sync.get(['backgroundPreference', 'copyToClipboard']);
  if (saved.backgroundPreference) {
    backgroundSelect.value = saved.backgroundPreference;
  }
  
  // Set clipboard preference (default to true if not set)
  clipboardToggle.checked = saved.copyToClipboard !== undefined ? saved.copyToClipboard : true;

  // Save background preference when changed
  backgroundSelect.addEventListener('change', () => {
    chrome.storage.sync.set({ backgroundPreference: backgroundSelect.value });
  });

  // Save clipboard preference when changed
  clipboardToggle.addEventListener('change', () => {
    chrome.storage.sync.set({ copyToClipboard: clipboardToggle.checked });
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
        background: backgroundSelect.value,
        copyToClipboard: clipboardToggle.checked
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

  // Handle tooltip keyboard navigation
  setupTooltipAccessibility();

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

  function setupTooltipAccessibility() {
    const tooltipIcon = document.querySelector('.tooltip-icon');
    const tooltipContent = document.querySelector('.tooltip-content');
    
    if (!tooltipIcon || !tooltipContent) return;

    // Handle keyboard events for tooltip
    tooltipIcon.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        // Toggle tooltip visibility on Enter/Space
        const isVisible = tooltipContent.style.visibility === 'visible';
        tooltipContent.style.visibility = isVisible ? 'hidden' : 'visible';
        tooltipContent.style.opacity = isVisible ? '0' : '1';
      } else if (e.key === 'Escape') {
        // Hide tooltip on Escape
        tooltipContent.style.visibility = 'hidden';
        tooltipContent.style.opacity = '0';
      }
    });

    // Hide tooltip when clicking outside
    document.addEventListener('click', (e) => {
      if (!tooltipIcon.contains(e.target)) {
        tooltipContent.style.visibility = 'hidden';
        tooltipContent.style.opacity = '0';
      }
    });

    // Handle focus loss
    tooltipIcon.addEventListener('blur', (e) => {
      // Small delay to allow for focus to move to tooltip content if needed
      setTimeout(() => {
        if (!tooltipIcon.matches(':focus-within')) {
          tooltipContent.style.visibility = 'hidden';
          tooltipContent.style.opacity = '0';
        }
      }, 100);
    });
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