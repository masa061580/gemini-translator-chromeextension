# Gemini Translator Chrome Extension

Google Gemini APIを使用したシンプルな英日・日英翻訳Chrome拡張機能です。

## 機能

- **自動言語検出**: 入力されたテキストが日本語か英語かを自動判定して翻訳
- **英日・日英翻訳**: Google Gemini APIの高品質な翻訳を利用
- **モデル選択**: gemini-2.5-flash-lite / gemini-2.5-flash から選択可能
- **コンテキストメニュー統合**: テキスト選択して右クリックから翻訳
- **翻訳履歴**: 最新10件の翻訳履歴を保存・表示
- **自動クリップボードコピー**: 翻訳結果を自動的にクリップボードにコピー
- **シンプルなUI**: 使いやすいポップアップインターフェース

## インストール方法

### 1. Gemini API Keyの取得

1. [Google AI Studio](https://aistudio.google.com/) にアクセス
2. Googleアカウントでログイン
3. 左メニューから **"Get API Key"** をクリック
4. **"Create API Key"** をクリック
5. 既存のGoogle Cloud プロジェクトを選択するか、新規プロジェクトを作成
6. 生成されたAPI Keyをコピー

> **注意**: API Keyは安全に保管してください。公開リポジトリにコミットしないでください。

### 2. Chrome拡張機能のインストール
1. このリポジトリをクローンまたはダウンロード
   ```bash
   git clone https://github.com/masa061580/gemini-translator-chromeextension.git
   ```
2. Chromeで `chrome://extensions/` を開く
3. 右上の「デベロッパーモード」をオンにする
4. 「パッケージ化されていない拡張機能を読み込む」をクリック
5. クローンしたフォルダを選択

### 3. 初期設定
1. 拡張機能アイコンをクリック
2. 取得したGemini API Keyを入力して「保存」
3. お好みのモデルを選択（デフォルト: gemini-2.5-flash-lite）
4. 設定完了！

## 使用方法

### 基本的な使い方

1. **ポップアップから翻訳**:
   - 拡張機能アイコンをクリック
   - テキストエリアに翻訳したいテキストを入力
   - 「翻訳」ボタンをクリック、またはCtrl+Enterキー
   - 翻訳結果が表示され、自動的にクリップボードにコピーされます

2. **コンテキストメニューから翻訳**:
   - Webページ上のテキストを選択
   - 右クリックして「Gemini翻訳」を選択
   - 自動的にポップアップが開き、翻訳が実行されます

3. **履歴を活用する**:
   - 過去の翻訳履歴（最新10件）が下部に表示されます
   - 履歴アイテムをクリックすると、その翻訳を再表示できます
   - 「履歴をクリア」ボタンで履歴を全削除できます

4. **設定変更**:
   - 「設定」ボタンからAPI Keyを変更できます
   - 現在のAPI Keyの最後4文字のみが表示されます
   - モデル選択ドロップダウンで使用するモデルを切り替えられます

## ショートカットキー

- **Ctrl + Enter**: 翻訳実行
- **Enter** (API Key入力時): API Key保存

## ファイル構成

```
gemini-translator-chromeextension/
├── manifest.json      # Chrome拡張機能の設定
├── popup.html         # ポップアップUI
├── popup.js          # メインロジック（翻訳、履歴管理）
├── background.js      # バックグラウンドスクリプト（コンテキストメニュー）
├── styles.css        # スタイルシート
├── icons/            # 拡張機能アイコン
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── README.md         # このファイル
└── CLAUDE.md         # 開発者向けドキュメント
```

## 技術仕様

- **Manifest Version**: 3
- **API**: Google Gemini API (https://generativelanguage.googleapis.com)
- **対応モデル**:
  - `gemini-2.5-flash-lite` (デフォルト)
  - `gemini-2.5-flash`
- **権限**:
  - `storage`: 履歴、API Key、モデル選択の保存用
  - `clipboardWrite`: 翻訳結果の自動コピー用
  - `contextMenus`: 右クリックメニュー統合
  - `notifications`: 通知表示用
- **対応言語**: 英語 ⇄ 日本語（自動判定）

## エラーと対処法

### よくあるエラー

1. **"翻訳に失敗しました: HTTP 400"**
   - API Keyが無効または不正な形式です
   - Google AI Studioで新しいAPI Keyを生成してください

2. **"翻訳に失敗しました: HTTP 403"**
   - API Keyの権限に問題があります
   - Google Cloud Consoleでプロジェクトの設定を確認してください

3. **"翻訳に失敗しました: HTTP 429"**
   - レート制限に達しました
   - しばらく待ってから再試行してください

4. **"models/gemini-xxx is not found"**
   - 指定されたモデルが利用できません
   - サポートされているモデル（gemini-2.5-flash-lite / gemini-2.5-flash）を選択してください

5. **"クリップボードへのコピーに失敗しました"**
   - ブラウザの権限設定を確認してください
   - 手動で「コピー」ボタンをクリックしてください

### トラブルシューティング

1. **拡張機能が動作しない**
   - `chrome://extensions/` で拡張機能が有効になっているか確認
   - ページを再読み込みして再試行

2. **翻訳結果が表示されない**
   - インターネット接続を確認
   - API Keyが正しく設定されているか確認
   - ブラウザの開発者ツールでエラーログを確認

## 制限事項

- Gemini API の利用制限が適用されます（無料枠あり）
- 現在は英語と日本語のみ対応しています
- インターネット接続が必要です
- 翻訳結果の品質はGemini APIのモデルに依存します

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 更新履歴

### v1.0 (2025-10-05)
- 初回リリース
- Google Gemini API統合
- 基本的な翻訳機能（英語 ⇄ 日本語）
- モデル選択機能（gemini-2.5-flash-lite / gemini-2.5-flash）
- コンテキストメニュー統合
- 翻訳履歴機能（最大10件）
- 自動クリップボードコピー機能

## 貢献

バグ報告や機能リクエストは[Issues](https://github.com/masa061580/gemini-translator-chromeextension/issues)までお願いします。

## 作者

masa061580

## 謝辞

このプロジェクトはGoogle Gemini APIを使用しています。