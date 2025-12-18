# AI搭載リアルタイム議事録作成アプリケーション

Web Speech APIとGoogle Gemini APIを活用した、リアルタイム音声認識・AI要約・話者識別機能を搭載した包括的な議事録作成Webアプリケーションです。

## 主要機能

### 🤖 AI機能（Gemini API統合）
- **AI要約**: 会議内容の自動要約生成
- **話者識別**: 複数話者の自動識別と分類
- **トークン管理**: 使用量トラッキングとレート制限管理

### 🎤 音声認識・変換
- **リアルタイム音声認識**: Web Speech APIによる連続音声認識（日本語対応）
- **音声合成**: 認識テキストからの音声読み上げ機能
- **ライブ文字起こし**: リアルタイム表示対応

### 📊 可視化・管理
- **タイムライン表示**: 話者別発言の時系列可視化
- **履歴管理**: セッション保存・検索機能
- **インライン編集**: タイムライン上での直接編集

### 💾 データ管理
- **エクスポート**: JSON形式（話者情報付き）・TXT形式
- **インポート**: 過去セッションの読み込み
- **構造化データ**: 話者・発言・タイムスタンプの完全な記録

## セットアップ

### 必要要件
- **Gemini APIキー**: [Google AI Studio](https://aistudio.google.com/app/apikey)から取得
- **推奨ブラウザ**: Chrome/Chromiumベース（Web Speech API最適化）
- **マイクアクセス**: 音声認識機能に必須
- **HTTPS**: 本番環境でのマイクアクセスに必要

### ローカル開発
```bash
# ローカル開発サーバーを開始
npm run serve

# アクセス
# AI議事録アプリ: http://localhost:3000/minutes/
```

### Gemini API設定
1. アプリケーションを開く
2. 画面上部の「gemini-api-key」フィールドにAPIキーを入力
3. 「APIキー確認」ボタンをクリックして検証
4. 使用するモデルを選択（デフォルト: gemini-2.5-flash）

## 使用方法

### 基本フロー
1. **APIキー設定**: Gemini APIキーを入力・検証
2. **音声認識開始**: 「音声認識を開始」ボタンをクリック
3. **リアルタイム文字起こし**: 発言が自動的にテキスト化
4. **AI分析**:
   - 「テキストを要約」: 会議内容の要約を生成
   - 「話者を識別」: 話者を自動識別してタイムライン表示
5. **保存・エクスポート**:
   - 「履歴に保存」: ローカルストレージに保存
   - 「PCに保存」: JSON/TXT形式でダウンロード

### タイムライン機能
- 話者識別後、右側にタイムライン表示
- 各発言は話者ごとに色分け
- 発言をクリックして直接編集可能
- ゴミ箱アイコンで発言を削除

## アーキテクチャ

### ディレクトリ構成

```
/
├── minutes/                        # AI議事録アプリケーション
│   ├── index.html                  # メインHTML
│   ├── css/
│   │   ├── style.css               # 統一スタイルシート
│   │   └── history.css             # 履歴・タイムラインスタイル
│   ├── js/
│   │   ├── main.js                 # メインアプリケーションクラス
│   │   ├── geminiManager.js        # Gemini API管理
│   │   ├── speechRecognition.js    # 音声認識管理
│   │   ├── textToSpeech.js         # 音声合成管理
│   │   ├── timelineRenderer.js     # タイムライン描画
│   │   ├── uiManager.js            # UI状態管理
│   │   ├── tabManager.js           # タブ・履歴管理
│   │   ├── domElements.js          # DOM要素管理
│   │   ├── debugLogger.js          # デバッグログ機能
│   │   ├── vibeLogger.js           # AI用構造化ログ
│   │   └── debugUI.js              # リアルタイムデバッグUI
│   └── speak.js                    # 音声合成ユーティリティ
│
├── docs/                           # ドキュメント
├── README.md                       # プロジェクトREADME
├── CLAUDE.md                       # 開発ガイド
├── DEBUG.md                        # デバッグガイド
└── package.json                    # 依存関係管理
```

### 主要コンポーネント

**AI・音声認識:**
- `geminiManager.js`: Gemini API管理（要約・話者識別・トークン管理）
- `speechRecognition.js`: Web Speech API音声認識
- `textToSpeech.js`: 音声合成管理

**UI・可視化:**
- `timelineRenderer.js`: タイムライン描画・編集
- `uiManager.js`: UI状態管理
- `tabManager.js`: タブ・履歴管理
- `domElements.js`: DOM要素アクセス管理

**デバッグ・ログ:**
- `debugLogger.js`: メインデバッグログ機能
- `vibeLogger.js`: AIコードエージェント用構造化ログ
- `debugUI.js`: リアルタイムデバッグUI

## データフォーマット

### JSON形式（エクスポート）
```json
{
  "timestamp": "2024-12-04T12:30:00.000Z",
  "originalText": "会議の全文テキスト",
  "summary": "AI生成の要約文",
  "utterances": [
    {
      "name": "話者A",
      "text": "発言内容"
    },
    {
      "name": "話者B",
      "text": "発言内容"
    }
  ]
}
```

### TXT形式（エクスポート）
```
会議の全文テキスト（プレーンテキスト）
```

## 技術仕様

### 依存関係
- **@google/genai** ^1.25.0: Gemini API統合（ESM CDN経由）
- **vibelogger** ^0.1.0: AI可読構造化ログ
- **Web Speech API**: 音声認識（ブラウザ標準）
- **Speech Synthesis API**: 音声合成（ブラウザ標準）

### Geminiモデル対応
- `gemini-2.5-flash` (デフォルト): RPM 10, TPM 250K, RPD 1000
- `gemini-2.0-flash`: RPM 15, TPM 1M, RPD 1500
- `gemini-2.5-pro`: 高精度モデル
- カスタムモデル対応

### パフォーマンス
- リアルタイム音声認識: 低遅延処理
- AI要約: 数秒～十数秒（テキスト量による）
- 話者識別: 数秒～十数秒（発言数による）
- デバッグログ: 最小限のパフォーマンス影響

## 開発・デバッグ

### デバッグシステム

#### vibelogger統合
- **構造化ログ**: AIコードエージェント用の高度なログ機能
- **出力形式**: JSON/CSV/TXT形式で `./logs/` ディレクトリに出力
- **リアルタイム監視**: デバッグUIでのライブモニタリング

#### ログレベル
- **ERROR/WARN/INFO/DEBUG/TRACE**: 5段階のログレベル
- **開発時**: DEBUGレベル推奨
- **本番前**: INFOレベルに設定

#### デバッグ機能有効化
```
# URLパラメータでデバッグモードを有効化
?debug=DEBUG&debugUI=true

# デバッグキーボードショートカット
Ctrl+D: デバッグパネル切り替え
```

### 開発ワークフロー
1. **機能設計**: モジュール単位での機能設計
2. **実装**: 対応するクラス・モジュールでの実装
3. **デバッグ**: vibeloggerとデバッグUIでの動作確認
4. **統合テスト**: 全体フローでの動作検証

### 推奨事項
- デバッグ時は必ずvibeloggerを使用
- パフォーマンス監視（特にGemini API呼び出し時）
- 開発中はデバッグUIを有効化
- モジュール単位での機能分割を維持

## 処理フロー
![6656565-1](https://github.com/user-attachments/assets/49fac104-e658-44c6-a52c-0db5e0cc4c47)

## デプロイメント

**本番デプロイ:**
- Git → GitHub Actions → さくらサーバー（自動デプロイ）
- **重要**: WinSCPでの直接アップロードは禁止
- GitHubリポジトリ経由での自動デプロイを必須とする

## バージョン情報

### 現在のバージョン
**AI議事録アプリケーション** (`/minutes/`)
- Gemini API統合（AI要約・話者識別）
- リアルタイム音声認識（日本語対応）
- タイムライン可視化・インライン編集
- 構造化データエクスポート（JSON/TXT）
- 履歴管理・検索機能
- デバッグシステム統合（vibelogger）

### 更新履歴
- **2025-12-18**: レガシー機能（kuromoji.js含む）を削除、メイン機能に統合完了

## ライセンス・クレジット

- **Web Speech API**: ブラウザ標準API
- **Google Gemini API**: Google AI
- **vibelogger**: https://github.com/fladdict/vibe-logger

---

## 開発者向け情報

詳細な開発ガイドラインについては `CLAUDE.md` を参照してください。
