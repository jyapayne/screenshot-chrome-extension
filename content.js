// Content script for Full Screenshot Selector Chrome Extension
class ScreenshotSelector {
  constructor() {
    this.isActive = false;
    this.currentHighlight = null;
    this.overlay = null;
    this.style = null;
    this.background = 'black';
  }

  async init(background = 'black') {
    if (this.isActive) {
      console.log('Screenshot selector already active');
      return;
    }

    this.background = background;
    this.isActive = true;

    this.createUI();
    this.addEventListeners();
  }

  createUI() {
    // Create overlay UI
    this.overlay = document.createElement('div');
    this.overlay.id = 'screenshot-selector-overlay';
    this.overlay.innerHTML = `
      <div style="position: fixed; top: 20px; left: 20px; background: rgba(0,0,0,0.9); color: white; padding: 12px 16px; border-radius: 8px; z-index: 2147483647; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); backdrop-filter: blur(10px);">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span>📸</span>
          <span>Hover over elements and click to capture</span>
          <button id="screenshot-cancel" style="margin-left: 10px; padding: 4px 8px; background: #ff4757; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">ESC</button>
        </div>
      </div>
    `;

    // Add hover highlighting styles
    this.style = document.createElement('style');
    this.style.textContent = `
      .screenshot-highlight {
        outline: 3px solid #00d2ff !important;
        outline-offset: 2px !important;
        cursor: crosshair !important;
        position: relative !important;
      }
      .screenshot-highlight::after {
        content: '';
        position: absolute;
        top: -5px;
        left: -5px;
        right: -5px;
        bottom: -5px;
        background: rgba(0, 210, 255, 0.1) !important;
        pointer-events: none !important;
        z-index: 2147483646 !important;
      }
      .screenshot-scrollable-indicator {
        position: absolute !important;
        border: 2px dotted #ff6b6b !important;
        background: rgba(255, 107, 107, 0.05) !important;
        pointer-events: none !important;
        z-index: 2147483645 !important;
      }
      #screenshot-selector-overlay * {
        cursor: default !important;
      }
    `;

    document.head.appendChild(this.style);
    document.body.appendChild(this.overlay);

    // Cancel button functionality
    document.getElementById('screenshot-cancel').onclick = () => this.cleanup();
  }

  addEventListeners() {
    this.handleMouseOver = this.handleMouseOver.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);

    document.addEventListener('mouseover', this.handleMouseOver);
    document.addEventListener('click', this.handleClick, true);
    document.addEventListener('keydown', this.handleKeyPress);
  }

  handleMouseOver(e) {
    if (e.target.closest('#screenshot-selector-overlay')) return;

    // Clean up previous highlights and indicators
    if (this.currentHighlight) {
      this.currentHighlight.classList.remove('screenshot-highlight');
      this.removeScrollableIndicators();
    }

    this.currentHighlight = e.target;
    e.target.classList.add('screenshot-highlight');

    // Add scrollable content indicators
    this.addScrollableIndicators(e.target);
  }

  handleClick(e) {
    if (e.target.closest('#screenshot-selector-overlay')) return;
    e.preventDefault();
    e.stopPropagation();

    const element = e.target;
    this.captureElement(element);
  }

  handleKeyPress(e) {
    if (e.key === 'Escape') {
      this.cleanup();
    }
  }

  addScrollableIndicators(element) {
    const rect = element.getBoundingClientRect();
    const hasVerticalScroll = element.scrollHeight > element.clientHeight;
    const hasHorizontalScroll = element.scrollWidth > element.clientWidth;

    if (!hasVerticalScroll && !hasHorizontalScroll) return;

    // Calculate the full content dimensions
    const fullHeight = element.scrollHeight;
    const fullWidth = element.scrollWidth;
    const visibleHeight = element.clientHeight;
    const visibleWidth = element.clientWidth;

    // Create indicator for full scrollable area
    if (hasVerticalScroll || hasHorizontalScroll) {
      const indicator = document.createElement('div');
      indicator.className = 'screenshot-scrollable-indicator';
      indicator.setAttribute('data-screenshot-indicator', 'true');

      // Position it relative to the viewport
      const style = {
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: hasHorizontalScroll ? `${fullWidth}px` : `${rect.width}px`,
        height: hasVerticalScroll ? `${fullHeight}px` : `${rect.height}px`,
      };

      Object.assign(indicator.style, style);
      document.body.appendChild(indicator);

      // Add a label to show the full dimensions
      const label = document.createElement('div');
      label.setAttribute('data-screenshot-indicator', 'true');
      label.style.cssText = `
        position: fixed;
        top: ${rect.top - 25}px;
        left: ${rect.left}px;
        background: rgba(255, 107, 107, 0.9);
        color: white;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 11px;
        font-family: monospace;
        z-index: 2147483647;
        pointer-events: none;
      `;

      const scrollInfo = [];
      if (hasVerticalScroll) scrollInfo.push(`H: ${fullHeight}px (visible: ${visibleHeight}px)`);
      if (hasHorizontalScroll) scrollInfo.push(`W: ${fullWidth}px (visible: ${visibleWidth}px)`);
      label.textContent = `Full content - ${scrollInfo.join(', ')}`;

      document.body.appendChild(label);
    }
  }

  removeScrollableIndicators() {
    const indicators = document.querySelectorAll('[data-screenshot-indicator]');
    indicators.forEach(indicator => indicator.remove());
  }

  // Helper method to generate a unique selector for an element
  getElementSelector(element) {
    // Escape helper for CSS identifiers (handles Tailwind classes like lg:pr-0)
    const escapeIdent = (ident) => {
      try {
        if (window.CSS && typeof window.CSS.escape === 'function') {
          return window.CSS.escape(ident);
        }
      } catch (_) {}
      // Fallback: escape most punctuation characters
      return String(ident).replace(/([ !"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1');
    };

    if (element.id) {
      return `#${escapeIdent(element.id)}`;
    }

    if (element.classList && element.classList.length) {
      const classSelector = Array.from(element.classList)
        .filter(Boolean)
        .map(cls => `.${escapeIdent(cls)}`)
        .join('');
      if (classSelector) {
        return `${element.tagName.toLowerCase()}${classSelector}`;
      }
    }

    // Fallback to tag name and position
    const siblings = Array.from(element.parentNode?.children || []);
    const index = siblings.indexOf(element);
    return `${element.tagName.toLowerCase()}:nth-child(${index + 1})`;
  }

    // Preserve computed styles for better rendering
  preserveComputedStyles(clonedElement, originalElement) {
    if (!originalElement || !clonedElement) return;

    const computedStyle = window.getComputedStyle(originalElement);

    // Comprehensive style properties including layout and icon-related ones
    const importantStyles = [
      // Typography and fonts
      'font-family', 'font-size', 'font-weight', 'font-style', 'font-variant',
      'text-align', 'text-decoration', 'text-transform', 'text-indent',
      'line-height', 'letter-spacing', 'word-spacing', 'white-space',

      // Colors and backgrounds
      'color', 'background-color', 'background-image', 'background-size',
      'background-position', 'background-repeat', 'background-attachment',

      // Layout and positioning
      'display', 'position', 'top', 'left', 'right', 'bottom',
      'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
      'margin', 'padding', 'border', 'border-radius',
      'float', 'clear', 'vertical-align',

      // Flexbox and Grid
      'flex', 'flex-direction', 'flex-wrap', 'flex-basis', 'flex-grow', 'flex-shrink',
      'justify-content', 'align-items', 'align-self', 'align-content',
      'grid', 'grid-template', 'grid-area', 'grid-column', 'grid-row',

      // Visual effects
      'opacity', 'visibility', 'overflow', 'overflow-x', 'overflow-y',
      'box-shadow', 'text-shadow', 'transform', 'filter',
      'z-index', 'cursor'
    ];

    // Apply computed styles
    importantStyles.forEach(property => {
      const value = computedStyle.getPropertyValue(property);
      if (value && value !== 'none' && value !== 'normal' && value !== 'auto' && value !== 'initial') {
        try {
          clonedElement.style.setProperty(property, value, 'important');
        } catch (e) {
          // Skip properties that can't be set
        }
      }
    });

    // Handle pseudo-elements (::before and ::after) which often contain icons
    this.preservePseudoElements(clonedElement, originalElement);

    // Recursively apply to children
    const originalChildren = Array.from(originalElement.children);
    const clonedChildren = Array.from(clonedElement.children);

    for (let i = 0; i < Math.min(originalChildren.length, clonedChildren.length); i++) {
      this.preserveComputedStyles(clonedChildren[i], originalChildren[i]);
    }
  }

     // Handle pseudo-elements that often contain icons
   preservePseudoElements(clonedElement, originalElement) {
     try {
       ['::before', '::after'].forEach(pseudo => {
         const pseudoStyle = window.getComputedStyle(originalElement, pseudo);
         const content = pseudoStyle.getPropertyValue('content');

         // If pseudo-element has content, try to preserve it
         if (content && content !== 'none' && content !== '""') {
           const pseudoProperties = [
             'content', 'display', 'position', 'top', 'left', 'right', 'bottom',
             'width', 'height', 'font-family', 'font-size', 'color',
             'background-color', 'background-image', 'border', 'border-radius',
             'transform', 'opacity'
           ];

           // Create inline style for pseudo-element
           let selector = this.getElementSelector(clonedElement);
           let pseudoCSS = `${selector}${pseudo} {`;
           pseudoProperties.forEach(prop => {
             const value = pseudoStyle.getPropertyValue(prop);
             if (value && value !== 'none' && value !== 'normal') {
               pseudoCSS += `${prop}: ${value} !important;`;
             }
           });
           pseudoCSS += '}';

           // Add to document head
           const style = document.createElement('style');
           style.textContent = pseudoCSS;
           document.head.appendChild(style);
         }
       });
     } catch (e) {
       // Pseudo-element handling failed, continue without it
     }
   }

   // Wait for fonts and resources to load properly
   async waitForFontsAndResources(element) {
     // Wait for document fonts to load
     if (document.fonts && document.fonts.ready) {
       try {
         await document.fonts.ready;
       } catch (e) {
         // Font loading API not available or failed
       }
     }

     // Check for icon fonts (Font Awesome, Material Icons, etc.)
     const iconFontFamilies = [
       'FontAwesome', 'Font Awesome', 'Font Awesome 5', 'Font Awesome 6',
       'Material Icons', 'Material Icons Outlined', 'Material Icons Sharp',
       'Ionicons', 'Feather', 'Lucide', 'Tabler Icons'
     ];

     // Force load any icon fonts found in the element
     const allElements = [element, ...element.querySelectorAll('*')];
     const fontPromises = [];

     allElements.forEach(el => {
       const computedStyle = window.getComputedStyle(el);
       const fontFamily = computedStyle.fontFamily;

       iconFontFamilies.forEach(iconFont => {
         if (fontFamily.includes(iconFont)) {
           // Create a test element to ensure font is loaded
           const testEl = document.createElement('span');
           testEl.style.fontFamily = iconFont;
           testEl.style.position = 'absolute';
           testEl.style.left = '-9999px';
           testEl.textContent = '■'; // Use a test character
           document.body.appendChild(testEl);

           const fontPromise = new Promise(resolve => {
             setTimeout(() => {
               document.body.removeChild(testEl);
               resolve();
             }, 100);
           });
           fontPromises.push(fontPromise);
         }
       });
     });

     // Wait for all font loading attempts
     await Promise.all(fontPromises);

         // Additional wait for any remaining resources
    await new Promise(resolve => setTimeout(resolve, 500));
  }



  async captureElement(element) {
    try {
      // Show loading state
      this.overlay.innerHTML = `
        <div style="position: fixed; top: 20px; left: 20px; background: rgba(0,0,0,0.9); color: white; padding: 12px 16px; border-radius: 8px; z-index: 2147483647; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 16px; height: 16px; border: 2px solid #fff; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <span>Capturing screenshot...</span>
          </div>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `;

      // Remove highlight for clean capture first
      element.classList.remove('screenshot-highlight');
      this.removeScrollableIndicators();

      // Store original styles
      const originalStyles = {
        overflow: element.style.overflow,
        overflowY: element.style.overflowY,
        overflowX: element.style.overflowX,
        height: element.style.height,
        maxHeight: element.style.maxHeight,
        position: element.style.position,
        zIndex: element.style.zIndex,
      };

      // Temporarily modify element for full capture
      element.style.overflow = 'visible';
      element.style.overflowY = 'visible';
      element.style.overflowX = 'visible';
      element.style.height = `${element.scrollHeight}px`;
      element.style.maxHeight = 'none';

      // Wait for fonts and external resources to load
      await this.waitForFontsAndResources(element);

            // Enhanced html2canvas configuration
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: false,
        backgroundColor: this.background === 'transparent' ? null :
                        this.background === 'white' ? '#ffffff' : '#000000',

        // Improved rendering options
        scale: window.devicePixelRatio || 1, // Use device pixel ratio for crisp images
        logging: false, // Disable logging for cleaner console

        // Better handling of external resources
        imageTimeout: 15000, // Wait longer for images to load

        // Font handling and style preservation
        onclone: (clonedDoc, clonedElementParam) => {
          // Ensure all stylesheets are loaded in cloned document
          const originalStyleSheets = Array.from(document.styleSheets);
          const clonedHead = clonedDoc.head;

          // Copy all stylesheets to cloned document
          originalStyleSheets.forEach(styleSheet => {
            try {
              if (styleSheet.href) {
                // External stylesheet
                const link = clonedDoc.createElement('link');
                link.rel = 'stylesheet';
                link.href = styleSheet.href;
                link.type = 'text/css';
                clonedHead.appendChild(link);
              } else if (styleSheet.ownerNode && styleSheet.ownerNode.tagName === 'STYLE') {
                // Inline stylesheet
                const style = clonedDoc.createElement('style');
                style.type = 'text/css';
                try {
                  const cssText = Array.from(styleSheet.cssRules).map(rule => rule.cssText).join('\n');
                  style.textContent = cssText;
                } catch (e) {
                  // Fallback to original text content
                  style.textContent = styleSheet.ownerNode.textContent;
                }
                clonedHead.appendChild(style);
              }
            } catch (e) {
              // Skip stylesheets that can't be accessed (CORS issues)
              console.log('Skipped stylesheet due to CORS:', e);
            }
          });

          // Apply computed styles to preserve appearance
          const clonedElement = clonedElementParam;
          const originalElement = element; // from outer scope
          if (clonedElement && originalElement) {
            this.preserveComputedStyles(clonedElement, originalElement);
          }

          return clonedDoc;
        }
      });

      // Restore original styles
      Object.assign(element.style, originalStyles);

      // Download image
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `screenshot-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.png`;
      link.click();

      // Success message
      this.overlay.innerHTML = `
        <div style="position: fixed; top: 20px; left: 20px; background: rgba(39, 174, 96, 0.95); color: white; padding: 12px 16px; border-radius: 8px; z-index: 2147483647; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span>✅</span>
            <span>Screenshot saved successfully!</span>
          </div>
        </div>
      `;

      // Notify popup
      chrome.runtime.sendMessage({ action: 'selectorStopped', reason: 'screenshot-taken' });

      setTimeout(() => this.cleanup(), 2000);

    } catch (error) {
      console.error('Screenshot failed:', error);
      this.overlay.innerHTML = `
        <div style="position: fixed; top: 20px; left: 20px; background: rgba(231, 76, 60, 0.95); color: white; padding: 12px 16px; border-radius: 8px; z-index: 2147483647; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span>❌</span>
            <span>Screenshot failed. Please try again.</span>
          </div>
        </div>
      `;
      setTimeout(() => this.cleanup(), 3000);
    }
  }

  cleanup() {
    document.removeEventListener('mouseover', this.handleMouseOver);
    document.removeEventListener('click', this.handleClick, true);
    document.removeEventListener('keydown', this.handleKeyPress);

    if (this.currentHighlight) {
      this.currentHighlight.classList.remove('screenshot-highlight');
    }

    // Remove any scrollable indicators
    this.removeScrollableIndicators();

    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }

    if (this.style) {
      this.style.remove();
      this.style = null;
    }

    this.isActive = false;
    this.currentHighlight = null;
  }
}

// Global instance
let screenshotSelector = new ScreenshotSelector();

// Add load indicator
console.log('Full Screenshot Selector content script loaded');

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
  switch (message.action) {
    case 'startSelector':
      screenshotSelector.init(message.background);
      sendResponse({ success: true });
      break;

    case 'stopSelector':
      screenshotSelector.cleanup();
      sendResponse({ success: true });
      break;

    case 'checkState':
      sendResponse({ isActive: screenshotSelector.isActive });
      break;

      default:
        sendResponse({ error: 'Unknown action: ' + message.action });
    }
  } catch (error) {
    console.error('Content script error:', error);
    sendResponse({ error: error.message });
  }

  // Important: return true to indicate async response
  return true;
});

// Handle keyboard shortcut
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'activateFromShortcut') {
    if (!screenshotSelector.isActive) {
      screenshotSelector.init('black'); // Default background for shortcut
    }
  }
});