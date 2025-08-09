# 🔵 Chrome Extension Installation Guide

## Quick Installation (Developer Mode)

1. **Open Chrome**
2. **Navigate to**: `chrome://extensions/`
3. **Enable**: "Developer mode" (toggle in top-right)
4. **Click**: "Load unpacked"
5. **Select**: This `chrome-extension` directory
6. **Done!** Extension will appear in your toolbar

## 🚀 Usage

1. **Click** the extension icon in the toolbar
2. **Or press** `Alt+Shift+S` (Option+Shift+S on Mac)
3. **Hover** over any element on a webpage
4. **Look for** red dotted borders showing scrollable content
5. **Click** to capture the full element screenshot

## 📦 Chrome Web Store (Future)

To publish to Chrome Web Store:
1. **ZIP** this entire directory
2. **Upload** to [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole)
3. **Fill out** store listing details
4. **Submit** for review

## ⚠️ Troubleshooting

- **Extension not loading**: Make sure to select the entire `chrome-extension` directory
- **No screenshots**: Check that html2canvas.min.js is present
- **Permissions error**: Make sure "Developer mode" is enabled
- **Keyboard shortcut conflicts**: Check Chrome settings > Extensions > Keyboard shortcuts

## 📁 What's Included

```
chrome-extension/
├── manifest.json          # Extension manifest (v3)
├── content.js            # Main functionality
├── background.js         # Service worker
├── popup.html           # Extension popup UI
├── popup.js             # Popup logic
├── html2canvas.min.js   # Screenshot library
├── icons/               # Extension icons
└── README.md            # Full documentation
```

## 🔄 Updates

To update the extension:
1. **Modify** files in this directory
2. **Go to** `chrome://extensions/`
3. **Click** the refresh icon on your extension
4. **Test** the changes

For complete documentation, see `README.md` in this directory.