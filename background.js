// Background service worker for Gemini Translator Extension

// 拡張機能のインストール時にコンテキストメニューを作成
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "gemini-translate",
        title: "Gemini翻訳",
        contexts: ["selection"]
    });
});

// コンテキストメニューがクリックされたときの処理
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "gemini-translate" && info.selectionText) {
        // 選択テキストをストレージに保存
        await chrome.storage.local.set({
            pendingTranslation: {
                text: info.selectionText,
                timestamp: Date.now(),
                fromContextMenu: true
            }
        });

        // 小さなポップアップウィンドウを作成
        const width = 520;
        const height = 650;
        
        // 現在のウィンドウの位置を取得
        const currentWindow = await chrome.windows.getCurrent();
        const left = Math.round(currentWindow.left + (currentWindow.width - width) / 2);
        const top = Math.round(currentWindow.top + (currentWindow.height - height) / 2);

        // ポップアップウィンドウを作成
        chrome.windows.create({
            url: chrome.runtime.getURL('popup.html?contextMenu=true'),
            type: 'popup',  // ポップアップタイプのウィンドウ
            width: width,
            height: height,
            left: left,
            top: top,
            focused: true
        });
    }
});

// ポップアップが開かれたときにバッジをクリア
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "clearBadge") {
        chrome.action.setBadgeText({ text: "" });
    }
});