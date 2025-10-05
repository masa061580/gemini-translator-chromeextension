# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome Extension that provides Japanese-English translation functionality using the Google Gemini API. The extension is built with vanilla JavaScript and uses Chrome Extension Manifest V3.

## Architecture

- **manifest.json**: Chrome Extension configuration (Manifest V3)
- **popup.html/js**: Main UI and translation logic, handles all user interactions
- **background.js**: Service worker handling context menu integration and popup window creation
- **styles.css**: Styling for the popup interface
- **icons/**: Extension icons in various sizes

### Component Responsibilities

**popup.js** (`GeminiTranslator` class):
- Translation logic via Gemini API
- Language detection (Japanese ⇄ English)
- Translation history management (max 10 items)
- API key storage and retrieval
- Clipboard operations
- Handles both normal popup mode and context menu mode via URL parameters

**background.js** (Service Worker):
- Creates context menu item "Gemini翻訳" on text selection
- Stores selected text in `chrome.storage.local` as `pendingTranslation`
- Opens centered popup window (520x650) when context menu is clicked
- Manages badge clearing via message passing

## Key Technical Details

### API Integration
- Uses Gemini API endpoint: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- Supported models (user-selectable):
  - `gemini-2.5-flash-lite` (default)
  - `gemini-2.5-flash`
- Automatically detects source language (Japanese/English) using regex pattern matching
- API key is stored in Chrome's local storage as `gemini_api_key`
- Selected model is stored in Chrome's local storage as `gemini_model`
- Prompt instructs Gemini to return ONLY the translation without explanations
- Uses `temperature: 0.1` for consistent translations

### Chrome Extension Permissions
- `storage`: For saving API key, translation history, and pending translations
- `clipboardWrite`: For auto-copying translation results
- `contextMenus`: For right-click translation of selected text
- `notifications`: For showing translation status notifications
- `host_permissions`: Access to Gemini API domain (`https://generativelanguage.googleapis.com/*`)

### Language Detection Logic
The extension automatically determines translation direction:
- Japanese text (contains hiragana/katakana/kanji) → English translation
- Non-Japanese text → Japanese translation

### Data Storage
- API key: Stored in `chrome.storage.local` as `gemini_api_key`
- Selected model: Stored in `chrome.storage.local` as `gemini_model`
- Translation history: Stored as `translation_history` array (max 10 items)
- Pending translations: Stored as `pendingTranslation` object with `text`, `timestamp`, and `fromContextMenu` fields (expires after 5 minutes)

### Context Menu Integration Flow
1. User selects text on any webpage and right-clicks
2. User clicks "Gemini翻訳" from context menu
3. background.js saves selected text to `chrome.storage.local.pendingTranslation`
4. background.js opens centered popup window with `?contextMenu=true` URL parameter
5. popup.js detects URL parameter, loads pending translation, and auto-translates
6. Pending translation is deleted after processing

## Development Commands

This is a Chrome Extension project with no build process. To test changes:

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Reload" on the extension card after making changes
4. Click the extension icon to test the popup

For debugging:
- Right-click the extension icon and select "Inspect popup" to open DevTools
- Console logs are visible in the popup's DevTools window

## Common Error Codes

- **HTTP 400**: Invalid request format or API key
- **HTTP 403**: API key permissions issue
- **HTTP 429**: Rate limit exceeded

## Testing Approach

Manual testing via the Chrome Extensions page. No automated test framework is configured.