# 📸 Full Screenshot Selector - Chrome Extension

A powerful Chrome extension that allows you to visually select and capture full screenshots of any element on a webpage, including hidden scrollable content.

## ✨ Features

- **Visual Element Selection**: Hover over any element and see it highlighted
- **Full Content Capture**: Captures complete scrollable content, not just visible area
- **Background Options**: Choose between black, transparent, or white backgrounds
- **Keyboard Shortcut**: Quick access with `Ctrl+Shift+S` (or `Cmd+Shift+S` on Mac)
- **Clean UI**: Non-intrusive interface with modern design
- **Auto-Download**: Screenshots save automatically with timestamps

## 🚀 Installation

### Option 1: Developer Mode (Recommended for now)

1. **Download/Clone** this extension folder to your computer
2. **Open Chrome** and go to `chrome://extensions/`
3. **Enable Developer Mode** (toggle in top-right corner)
4. **Click "Load unpacked"** and select the extension folder
5. **Pin the extension** to your toolbar for easy access

### Option 2: From Chrome Web Store
*Coming soon - will be published to Chrome Web Store*

## 🎯 How to Use

### Method 1: Extension Popup
1. **Click the extension icon** in your toolbar
2. **Choose background color** (Black/Transparent/White)
3. **Click "Start Element Selector"**
4. **Hover over elements** to see them highlighted
5. **Click any element** to capture a full screenshot
6. **Press ESC** or click the cancel button to exit

### Method 2: Keyboard Shortcut
1. **Press `Alt+Shift+S`** (or `Option+Shift+S` on Mac)
2. **Hover and click** elements to capture
3. **Press ESC** to exit

## 🔧 Background Options

- **Black**: Solid black background (great for light content)
- **Transparent**: No background (perfect for overlays)
- **White**: Solid white background (ideal for dark content)

## 📱 Compatibility

- ✅ **Chrome 88+** (Manifest V3 support)
- ✅ **All websites** (except Chrome internal pages)
- ✅ **Cross-platform** (Windows, Mac, Linux)

## 🛠️ Technical Details

The extension uses several advanced techniques to ensure complete content capture:

- **Style Modification**: Temporarily expands elements to their full content height
- **html2canvas-pro**: Uses the latest html2canvas library (included locally for CSP compliance)
- **CSS Override**: Handles various overflow and height constraints
- **Non-destructive**: Always restores original element styles

## 🔒 Privacy

- **No data collection**: Extension doesn't send any data to external servers
- **Local processing**: All screenshot processing happens on your device
- **No permissions abuse**: Only requests necessary permissions for functionality

## 🐛 Troubleshooting

**Screenshots not working on some sites?**
- Some sites with strict Content Security Policy may block html2canvas
- Try refreshing the page and trying again

**Element not highlighting properly?**
- Some complex layouts may interfere with highlighting
- The screenshot will still capture correctly

**Keyboard shortcut not working?**
- Check Chrome's extension shortcuts: `chrome://extensions/shortcuts`
- Make sure the shortcut isn't conflicting with other extensions

## 📄 File Structure

```
chrome-extension/
├── manifest.json       # Extension configuration
├── popup.html          # Extension popup interface
├── popup.js           # Popup logic and communication
├── content.js         # Main screenshot functionality
├── background.js      # Service worker for shortcuts
├── html2canvas.min.js # Screenshot library (local copy)
├── icons/            # Extension icons (16, 32, 48, 128px)
└── README.md         # This file
```

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📜 License

This project is open source and available under the MIT License.