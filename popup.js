// Gemini Translator Chrome Extension
class GeminiTranslator {
    constructor() {
        this.apiKey = '';
        this.model = 'gemini-2.5-flash-lite';
        this.maxHistoryItems = 10;
        this.isTranslating = false;

        this.init();
    }

    async init() {
        await this.loadApiKey();
        await this.loadModel();
        this.bindEvents();
        this.updateUI();
        await this.loadHistory();
        
        // URLパラメータをチェックしてコンテキストメニューモードか判定
        const urlParams = new URLSearchParams(window.location.search);
        const isContextMenu = urlParams.get('contextMenu') === 'true';
        
        if (isContextMenu) {
            // コンテキストメニューから開かれた場合
            await this.checkPendingTranslation();
            // ウィンドウのタイトルを変更（オプション）
            document.title = 'DeepL Translator - 翻訳中...';
        }
        
        // バッジをクリア（通常のポップアップの場合のみ）
        if (!isContextMenu && chrome.runtime) {
            chrome.runtime.sendMessage({ action: "clearBadge" }).catch(() => {});
        }
    }

    // API Key管理
    async loadApiKey() {
        try {
            const result = await chrome.storage.local.get(['gemini_api_key']);
            this.apiKey = result.gemini_api_key || '';
        } catch (error) {
            console.error('API Key読み込みエラー:', error);
        }
    }

    async saveApiKey(apiKey) {
        try {
            await chrome.storage.local.set({ gemini_api_key: apiKey });
            this.apiKey = apiKey;
            this.showStatus('API Keyが保存されました', 'success');
            this.updateUI();
        } catch (error) {
            console.error('API Key保存エラー:', error);
            this.showStatus('API Keyの保存に失敗しました', 'error');
        }
    }

    // モデル管理
    async loadModel() {
        try {
            const result = await chrome.storage.local.get(['gemini_model']);
            this.model = result.gemini_model || 'gemini-2.5-flash-lite';
            const modelSelect = document.getElementById('modelSelect');
            if (modelSelect) {
                modelSelect.value = this.model;
            }
        } catch (error) {
            console.error('モデル読み込みエラー:', error);
        }
    }

    async saveModel(model) {
        try {
            await chrome.storage.local.set({ gemini_model: model });
            this.model = model;
            this.showStatus('モデルが変更されました', 'success');
        } catch (error) {
            console.error('モデル保存エラー:', error);
            this.showStatus('モデルの保存に失敗しました', 'error');
        }
    }

    // UI更新
    updateUI() {
        const apiKeySetup = document.getElementById('apiKeySetup');
        const translatorMain = document.getElementById('translatorMain');
        
        if (this.apiKey) {
            apiKeySetup.style.display = 'none';
            translatorMain.style.display = 'block';
        } else {
            apiKeySetup.style.display = 'block';
            translatorMain.style.display = 'none';
        }
    }

    // イベントバインディング
    bindEvents() {
        // API Key保存
        document.getElementById('saveApiKey').addEventListener('click', () => {
            const apiKeyInput = document.getElementById('apiKeyInput');
            const apiKey = apiKeyInput.value.trim();
            
            if (apiKey) {
                this.saveApiKey(apiKey);
                apiKeyInput.value = '';
            } else {
                this.showStatus('API Keyを入力してください', 'error');
            }
        });

        // Enter キーでAPI Key保存
        document.getElementById('apiKeyInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('saveApiKey').click();
            }
        });

        // 翻訳ボタン
        document.getElementById('translateBtn').addEventListener('click', () => {
            this.translate();
        });

        // Enter キーで翻訳（Ctrl+Enterの場合）
        document.getElementById('inputText').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                this.translate();
            }
        });

        // クリアボタン
        document.getElementById('clearBtn').addEventListener('click', () => {
            document.getElementById('inputText').value = '';
            document.getElementById('resultText').value = '';
            document.getElementById('languageInfo').textContent = '';
            document.getElementById('copyBtn').style.display = 'none';
            this.clearStatus();
        });

        // コピーボタン
        document.getElementById('copyBtn').addEventListener('click', () => {
            this.copyToClipboard();
        });

        // 履歴クリア
        document.getElementById('clearHistoryBtn').addEventListener('click', () => {
            this.clearHistory();
        });

        // 設定ボタン
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.showSettings();
        });

        // モデル選択
        document.getElementById('modelSelect').addEventListener('change', (e) => {
            this.saveModel(e.target.value);
        });
    }

    // 翻訳機能
    async translate() {
        const inputText = document.getElementById('inputText').value.trim();
        
        if (!inputText) {
            this.showStatus('翻訳するテキストを入力してください', 'error');
            return;
        }

        if (this.isTranslating) {
            return;
        }

        this.isTranslating = true;
        const translateBtn = document.getElementById('translateBtn');
        translateBtn.disabled = true;
        translateBtn.textContent = '翻訳中...';
        
        this.showStatus('翻訳中...', 'loading');

        try {
            const result = await this.callGeminiAPI(inputText);
            await this.handleTranslationResult(inputText, result);
        } catch (error) {
            console.error('翻訳エラー:', error);
            this.showStatus('翻訳に失敗しました: ' + error.message, 'error');
        } finally {
            this.isTranslating = false;
            translateBtn.disabled = false;
            translateBtn.textContent = '翻訳';
        }
    }

    // Gemini API呼び出し
    async callGeminiAPI(text) {
        const targetLang = this.detectTargetLanguage(text);
        const targetLangName = targetLang === 'EN' ? '英語' : '日本語';

        // 翻訳結果のみを返すようプロンプトを設定
        const prompt = `Translate the following text to ${targetLangName}. Output ONLY the translation without any explanations, notes, or additional text.\n\nText: ${text}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 1024,
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    }

    // 対象言語の自動検出
    detectTargetLanguage(text) {
        // 簡単な日本語検出（ひらがな、カタカナ、漢字が含まれているか）
        const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
        
        if (japaneseRegex.test(text)) {
            return 'EN'; // 日本語→英語
        } else {
            return 'JA'; // 英語→日本語
        }
    }

    // 翻訳結果の処理
    async handleTranslationResult(originalText, result) {
        if (!result.candidates || result.candidates.length === 0) {
            throw new Error('翻訳結果が空です');
        }

        const candidate = result.candidates[0];
        if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
            throw new Error('翻訳結果が空です');
        }

        const translatedText = candidate.content.parts[0].text.trim();
        const targetLang = this.detectTargetLanguage(originalText);
        const sourceLang = targetLang === 'EN' ? 'JA' : 'EN';

        // 結果表示
        document.getElementById('resultText').value = translatedText;
        document.getElementById('languageInfo').textContent =
            `${this.getLanguageName(sourceLang)} → ${this.getLanguageName(targetLang)}`;
        document.getElementById('copyBtn').style.display = 'inline-block';

        // クリップボードに自動コピー
        await this.copyToClipboard(translatedText);

        // 履歴に保存
        await this.saveToHistory({
            original: originalText,
            translated: translatedText,
            sourceLang: sourceLang,
            targetLang: targetLang,
            timestamp: new Date().toISOString()
        });

        this.showStatus('翻訳完了（クリップボードにコピーしました）', 'success');
    }

    // 言語名取得
    getLanguageName(langCode) {
        const languages = {
            'EN': '英語',
            'JA': '日本語',
            'DE': 'ドイツ語',
            'FR': 'フランス語',
            'ES': 'スペイン語',
            'IT': 'イタリア語',
            'PT': 'ポルトガル語',
            'RU': 'ロシア語',
            'ZH': '中国語',
            'KO': '韓国語'
        };
        return languages[langCode] || langCode;
    }

    // クリップボードコピー
    async copyToClipboard(text = null) {
        try {
            const textToCopy = text || document.getElementById('resultText').value;
            if (!textToCopy) {
                this.showStatus('コピーするテキストがありません', 'error');
                return;
            }

            await navigator.clipboard.writeText(textToCopy);
            
            if (!text) {
                this.showStatus('クリップボードにコピーしました', 'success');
            }
        } catch (error) {
            console.error('クリップボードコピーエラー:', error);
            this.showStatus('クリップボードへのコピーに失敗しました', 'error');
        }
    }

    // 履歴管理
    async saveToHistory(historyItem) {
        try {
            const result = await chrome.storage.local.get(['translation_history']);
            let history = result.translation_history || [];

            // 新しいアイテムを先頭に追加
            history.unshift(historyItem);

            // 最大件数を超えた場合は古いものを削除
            if (history.length > this.maxHistoryItems) {
                history = history.slice(0, this.maxHistoryItems);
            }

            await chrome.storage.local.set({ translation_history: history });
            await this.loadHistory();
        } catch (error) {
            console.error('履歴保存エラー:', error);
        }
    }

    async loadHistory() {
        try {
            const result = await chrome.storage.local.get(['translation_history']);
            const history = result.translation_history || [];
            this.displayHistory(history);
        } catch (error) {
            console.error('履歴読み込みエラー:', error);
        }
    }

    displayHistory(history) {
        const historyList = document.getElementById('historyList');
        const historyCount = document.getElementById('historyCount');
        
        historyCount.textContent = `(${history.length}/${this.maxHistoryItems})`;
        
        if (history.length === 0) {
            historyList.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">履歴がありません</div>';
            return;
        }

        historyList.innerHTML = history.map((item, index) => {
            const date = new Date(item.timestamp).toLocaleString('ja-JP', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });

            return `
                <div class="history-item" data-index="${index}">
                    <div class="history-original">${this.escapeHtml(item.original)}</div>
                    <div class="history-translated">${this.escapeHtml(item.translated)}</div>
                    <div class="history-meta">
                        <span>${this.getLanguageName(item.sourceLang)} → ${this.getLanguageName(item.targetLang)}</span>
                        <span>${date}</span>
                    </div>
                </div>
            `;
        }).join('');

        // 履歴アイテムのクリックイベント
        historyList.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                const historyItem = history[index];
                document.getElementById('inputText').value = historyItem.original;
                document.getElementById('resultText').value = historyItem.translated;
                document.getElementById('languageInfo').textContent = 
                    `${this.getLanguageName(historyItem.sourceLang)} → ${this.getLanguageName(historyItem.targetLang)}`;
                document.getElementById('copyBtn').style.display = 'inline-block';
            });
        });
    }

    async clearHistory() {
        try {
            await chrome.storage.local.set({ translation_history: [] });
            await this.loadHistory();
            this.showStatus('履歴をクリアしました', 'success');
        } catch (error) {
            console.error('履歴クリアエラー:', error);
            this.showStatus('履歴のクリアに失敗しました', 'error');
        }
    }

    // 設定表示
    showSettings() {
        const currentKey = this.apiKey ? '●'.repeat(8) + this.apiKey.slice(-4) : 'なし';
        const newKey = prompt(`現在のAPI Key: ${currentKey}\n\n新しいAPI Keyを入力してください（キャンセルで変更なし）:`);
        
        if (newKey && newKey.trim()) {
            this.saveApiKey(newKey.trim());
        }
    }

    // ステータス表示
    showStatus(message, type = 'info') {
        const status = document.getElementById('status');
        status.textContent = message;
        status.className = `status ${type}`;
        
        // 成功メッセージは3秒後に自動消去
        if (type === 'success') {
            setTimeout(() => {
                this.clearStatus();
            }, 3000);
        }
    }

    clearStatus() {
        const status = document.getElementById('status');
        status.textContent = '';
        status.className = 'status';
    }

    // HTMLエスケープ
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 保存された翻訳待ちテキストをチェック
    async checkPendingTranslation() {
        try {
            const result = await chrome.storage.local.get(['pendingTranslation']);
            const pending = result.pendingTranslation;
            
            if (pending && pending.text) {
                // 5分以内のものだけ処理
                const fiveMinutes = 5 * 60 * 1000;
                if (Date.now() - pending.timestamp < fiveMinutes) {
                    // テキストエリアに設定
                    document.getElementById('inputText').value = pending.text;
                    
                    // 自動的に翻訳を実行
                    if (this.apiKey) {
                        this.showStatus('選択されたテキストを翻訳中...', 'info');
                        await this.translate();
                        // 翻訳完了後、タイトルを更新
                        document.title = 'DeepL Translator - 翻訳完了';
                    } else {
                        this.showStatus('API Keyが設定されていません', 'error');
                        document.title = 'DeepL Translator - API Key未設定';
                    }
                }
                
                // 処理後は削除
                await chrome.storage.local.remove(['pendingTranslation']);
            }
        } catch (error) {
            console.error('保存されたテキストの読み込みエラー:', error);
        }
    }
}

// 拡張機能の初期化
document.addEventListener('DOMContentLoaded', () => {
    new GeminiTranslator();
});