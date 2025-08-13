// Popup script for Chrome extension
document.addEventListener('DOMContentLoaded', async () => {
  const backgroundSelect = document.getElementById('background-select');
  const clipboardToggle = document.getElementById('clipboard-toggle');
  const saveToPcToggle = document.getElementById('save-to-pc-toggle');
  const startBtn = document.getElementById('start-selector');
  const stopBtn = document.getElementById('stop-selector');
  const status = document.getElementById('status');
  const validationWarning = document.getElementById('validation-warning');

  // Load saved preferences
  const saved = await chrome.storage.sync.get(['backgroundPreference', 'copyToClipboard', 'saveToPc']);
  if (saved.backgroundPreference) {
    backgroundSelect.value = saved.backgroundPreference;
  }
  
  // Set clipboard preference (default to true if not set)
  clipboardToggle.checked = saved.copyToClipboard !== undefined ? saved.copyToClipboard : true;
  
  // Set save to PC preference (default to true if not set to maintain existing behavior)
  saveToPcToggle.checked = saved.saveToPc !== undefined ? saved.saveToPc : true;

  // Validation function to ensure at least one output method is enabled
  function validateOutputMethods() {
    const hasValidOutput = clipboardToggle.checked || saveToPcToggle.checked;
    
    if (hasValidOutput) {
      validationWarning.style.display = 'none';
      startBtn.disabled = false;
      startBtn.setAttribute('aria-describedby', '');
    } else {
      validationWarning.style.display = 'block';
      startBtn.disabled = true;
      startBtn.setAttribute('aria-describedby', 'validation-warning');
    }
    
    return hasValidOutput;
  }

  // Initial validation check
  validateOutputMethods();

  // Save background preference when changed
  backgroundSelect.addEventListener('change', () => {
    chrome.storage.sync.set({ backgroundPreference: backgroundSelect.value });
  });

  // Save clipboard preference when changed
  clipboardToggle.addEventListener('change', () => {
    chrome.storage.sync.set({ copyToClipboard: clipboardToggle.checked });
    validateOutputMethods();
  });

  // Save save to PC preference when changed
  saveToPcToggle.addEventListener('change', () => {
    chrome.storage.sync.set({ saveToPc: saveToPcToggle.checked });
    validateOutputMethods();
  });

  // Start selector
  startBtn.addEventListener('click', async () => {
    // Validate output methods before proceeding
    if (!validateOutputMethods()) {
      showStatus('Error: Please enable at least one output method (Save to PC or Copy to Clipboard) to capture screenshots.', 'error');
      return;
    }

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
        copyToClipboard: clipboardToggle.checked,
        saveToPc: saveToPcToggle.checked
      });

      // Generate activation message based on enabled operations
      let activationMessage = 'Selector activated! Hover over elements and click to capture.';
      
      if (saveToPcToggle.checked && clipboardToggle.checked) {
        activationMessage = 'Selector activated! Screenshots will be saved and copied to clipboard.';
      } else if (saveToPcToggle.checked && !clipboardToggle.checked) {
        activationMessage = 'Selector activated! Screenshots will be saved to downloads folder.';
      } else if (!saveToPcToggle.checked && clipboardToggle.checked) {
        activationMessage = 'Selector activated! Screenshots will be copied to clipboard only.';
      }
      
      showStatus(activationMessage, 'success');
      toggleButtons(true);

      // Auto-close popup after starting
      setTimeout(() => window.close(), 1500);

    } catch (error) {
      console.error('Full error details:', error);
      
      let errorMessage = 'Error: Could not activate on this page.';
      
      if (error.message.includes('Could not establish connection')) {
        errorMessage = 'Error: Content script not loaded. Try refreshing the page and try again.';
      } else if (error.message.includes('permission')) {
        errorMessage = 'Error: Permission denied. Check if the page allows extensions.';
      } else if (error.message.includes('protocol')) {
        errorMessage = 'Error: Cannot capture screenshots on this page type (chrome://, file://, etc.).';
      }
      
      // Add context about what operations were attempted
      if (saveToPcToggle.checked && clipboardToggle.checked) {
        errorMessage += ' Neither file download nor clipboard copy could be set up.';
      } else if (saveToPcToggle.checked && !clipboardToggle.checked) {
        errorMessage += ' File download could not be set up.';
      } else if (!saveToPcToggle.checked && clipboardToggle.checked) {
        errorMessage += ' Clipboard copy could not be set up.';
      }
      
      showStatus(errorMessage, 'error');
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

  // Tooltips removed

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

  // Tooltips removed: no setup needed
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'selectorStopped') {
    const startBtn = document.getElementById('start-selector');
    const stopBtn = document.getElementById('stop-selector');
    const status = document.getElementById('status');
    const saveToPcToggle = document.getElementById('save-to-pc-toggle');
    const clipboardToggle = document.getElementById('clipboard-toggle');

    startBtn.style.display = 'block';
    stopBtn.style.display = 'none';

    if (message.reason === 'screenshot-taken') {
      // Generate success message based on current toggle states
      let successMessage = 'Screenshot captured!';
      
      if (saveToPcToggle.checked && clipboardToggle.checked) {
        successMessage = 'Screenshot saved and copied to clipboard!';
      } else if (saveToPcToggle.checked && !clipboardToggle.checked) {
        successMessage = 'Screenshot saved to downloads folder!';
      } else if (!saveToPcToggle.checked && clipboardToggle.checked) {
        successMessage = 'Screenshot copied to clipboard!';
      }
      
      status.textContent = successMessage;
      status.className = 'status success';
      status.style.display = 'block';
      setTimeout(() => status.style.display = 'none', 2000);
    } else if (message.reason === 'screenshot-failed') {
      // Handle screenshot failure
      let failureMessage = 'Screenshot capture failed. Please try again.';
      
      if (saveToPcToggle.checked && clipboardToggle.checked) {
        failureMessage = 'Screenshot capture failed. Neither file download nor clipboard copy could be completed.';
      } else if (saveToPcToggle.checked && !clipboardToggle.checked) {
        failureMessage = 'Screenshot capture failed. File download could not be completed.';
      } else if (!saveToPcToggle.checked && clipboardToggle.checked) {
        failureMessage = 'Screenshot capture failed. Clipboard copy could not be completed.';
      }
      
      status.textContent = failureMessage;
      status.className = 'status error';
      status.style.display = 'block';
      setTimeout(() => status.style.display = 'none', 3000);
    }
  }
});