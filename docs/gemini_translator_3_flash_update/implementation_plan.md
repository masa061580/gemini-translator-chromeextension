# 実装計画: Gemini Translator アップデート

## 目的
Chrome拡張「Gemini Translator」に、最新モデルGemini 3 Flashの追加、UIの改善（自動リサイズ）、および英語学習支援機能（校正・解説）を実装します。

## ユーザーレビューが必要な事項
- 特になし
- (注: gemini-3-flash-preview は現在プレビュー段階のモデルです)

## 変更内容

### UI構成 (popup.html / styles.css)
#### [MODIFY] [popup.html](file:///d:/Dropbox/___chrome拡張/gemini-translator-ver2/popup.html)
- モデル選択プルダウンに `gemini-3-flash-preview` を追加。
- **入力セクション**に以下のボタンを追加（初期状態は非表示、言語判定連動）:
  - 「校正」ボタン (英文入力時)
  - 「解説」ボタン (英文入力時)
- 結果セクションに、翻訳結果以外（校正・解説）を表示するためのエリアまたはモード切替を検討、あるいは既存の結果エリアを使用しつつヘッダー情報を付与。
- テキストエリアの自動リサイズ対応用の構造調整。

#### [MODIFY] [styles.css](file:///d:/Dropbox/___chrome拡張/gemini-translator-ver2/styles.css)
- テキストエリアの `min-height` 設定とリサイズ無効化 (`resize: none; overflow-y: hidden;`)。
- 「校正」「解説」ボタンのスタイル定義（翻訳ボタンと区別）。
- 校正・解説結果を見やすく表示するためのスタイル（diff表示や箇条書き解説用）。

### ロジック (popup.js)
#### [MODIFY] [popup.js](file:///d:/Dropbox/___chrome拡張/gemini-translator-ver2/popup.js)
- **モデル選択**: `gemini-3-flash-preview` を利用可能にする。
- **自動リサイズ**: `inputText` / `resultText` の自動高さ調整 `autoResizeTextarea` を実装。
- **言語判定とボタン制御**:
  - 入力テキストが英語（`EN`）の場合 -> 「翻訳」「校正」「解説」ボタンを表示。
  - 入力テキストが日本語（`JA`）の場合 -> 「翻訳」ボタンを表示（「校正」等は非表示）。
- **英文校正機能**:
  - 「校正」クリック -> `gemini-3-flash-preview` (or selected model) に「英文をより自然またはフォーマルに修正し、修正点とその理由を解説せよ」というプロンプトを送信。
  - 結果を表示エリアに出力。
- **英文解説機能**:
  - 「解説」クリック -> `gemini-3-flash-preview` (or selected model) に「文法構造の解説、重要単語の意味（TL;DR形式）」を生成させるプロンプトを送信。
  - 結果を表示エリアに出力。

## 検証計画

### 自動テスト
- 現状、自動テスト環境は構築されていないため、手動検証を行います。

### 手動検証手順
1. **モデル選択**:
   - popupを開き、モデル選択肢に `gemini-3-flash-preview` があることを確認。
   - 選択して翻訳が正常に機能することを確認。
2. **自動リサイズ**:
   - 長文を入力し、入力欄が自動的に広がることを確認。
   - 翻訳結果が長文の場合、出力欄が自動的に広がることを確認。
3. **英文校正モード**:
   - 日本語「私は英語を勉強しています」を入力し翻訳。
   - 翻訳結果（I am studying English 等）が表示された後、「校正」ボタンが表示されるか確認。
   - ボタンを押し、校正案と解説が表示されるか確認。
4. **英文解説モード**:
   - 英文「The quick brown fox jumps over the lazy dog.」を入力。
   - 「解説」ボタンが表示されるか確認。
   - ボタンを押し、文法解説と単語解説が表示されるか確認。
