# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 最重要事項（必読）

### 言語設定
- **推論・思考**: 英語で実施
- **ユーザー出力**: 日本語で応答
- この設定は全てのClaude Codeセッションで継続すること

### メイン機能の場所
- **メイン版**: `/minutes/` - AI搭載リアルタイム議事録作成アプリケーション（★開発はここで行う）
- **レガシー版**: `/`, `/AddSlider/` - ひらがな変換付き音声認識アプリ（🗑️ 削除予定）

### レガシー機能削除方針
- **kuromoji.js**を含むレガシー機能は**削除予定**
- メイン機能は`/minutes/`に完全移行済み
- 今後の開発は`/minutes/`のみで実施

### デプロイメント制約
- **✅ 正**: Git → GitHub Actions → さくらサーバー（自動デプロイ）
- **❌ 禁**: WinSCPでさくらサーバーへ直接アップロード
- **ブランチ**: 必ず指定されたブランチで作業（通常 `claude/` プレフィックス）

---

## 🗑️ 削除対象ファイル・フォルダ

### レガシー機能として削除予定

以下のファイル・フォルダは**kuromoji.js**を含むレガシー機能として削除予定です：

#### ディレクトリ
```
/AddSlider/          # 実験版ディレクトリ全体
/css/                # レガシー版スタイル
/js/                 # レガシー版スクリプト（kuromoji含む）
/img/                # スクリーンショット類（必要なら移行）
```

#### ファイル
```
/index.html          # ルートのレガシー版HTML
/speak.js            # ルートのspeak.js（minutes/speak.jsが正）
/UI希望.png          # レガシー画像ファイル
```

#### package.json依存関係
```
kuromoji ^0.1.2      # kuromoji本体（削除対象）
```

#### node_modules（kuromoji関連）
```
node_modules/kuromoji/
node_modules/async/          # kuromoji依存
node_modules/doublearray/    # kuromoji依存
node_modules/zlibjs/         # kuromoji依存
```

### 削除後に残るもの

```
/minutes/            # メイン版（AI議事録アプリ）
/docs/               # 機能拡張計画ドキュメント
README.md            # プロジェクトREADME
CLAUDE.md            # このファイル
DEBUG.md             # デバッグドキュメント
package.json         # 依存関係管理（kuromoji除外後）
package-lock.json    # 依存関係ロック
.vscode/             # VSCode設定
.claude/             # Claude設定
.github/             # GitHub Actions設定
node_modules/
├── vibelogger/      # 必要なパッケージ
└── lodash/          # 必要なパッケージ（geminiManager依存の場合）
```

---

## クイックリファレンス

### 開発サーバー起動
```bash
npm run serve
# メイン版（AI議事録）: http://localhost:8000/minutes/
```

### デバッグ有効化
```bash
# URL: ?debug=DEBUG&debugUI=true
# ショートカット: Ctrl+D（デバッグパネル切り替え）
# ブラウザのDevToolsコンソールでログ確認
```

### 主要ファイル（緊急時）
- `minutes/js/main.js` - メインアプリケーション
- `minutes/js/geminiManager.js` - Gemini API統合
- `minutes/js/speechRecognition.js` - 音声認識ロジック
- `minutes/js/timelineRenderer.js` - タイムライン表示
- `minutes/index.html` - メインHTML

---

## プロジェクト概要

**AI搭載リアルタイム議事録作成アプリケーション**

Web Speech APIとGoogle Gemini APIを活用し、リアルタイム音声認識・AI要約・話者識別機能を搭載した包括的な議事録作成Webアプリケーション。

### 主要機能

#### 🤖 AI機能（Gemini API統合）
- **AI要約**: 会議内容の自動要約生成
- **話者識別**: 複数話者の自動識別と分類
- **トークン管理**: 使用量トラッキングとレート制限管理

#### 🎤 音声認識・変換
- **リアルタイム音声認識**: Web Speech APIによる連続音声認識（日本語対応）
- **音声合成**: 認識テキストからの音声読み上げ
- **ライブ文字起こし**: リアルタイム表示

#### 📊 可視化・管理
- **タイムライン表示**: 話者別発言の時系列可視化
- **履歴管理**: セッション保存・検索機能
- **インライン編集**: タイムライン上での直接編集

#### 💾 データ管理
- **エクスポート**: JSON形式（話者情報付き）・TXT形式
- **インポート**: 過去セッションの読み込み
- **構造化データ**: 話者・発言・タイムスタンプの完全な記録

---

## ディレクトリ構造

### 現在の構造（削除前）

```
/
├── minutes/                        # ★メイン版（AI議事録アプリ）
│   ├── index.html
│   ├── speak.js
│   ├── css/
│   │   ├── style.css
│   │   └── history.css
│   └── js/
│       ├── main.js
│       ├── geminiManager.js
│       ├── speechRecognition.js
│       ├── textToSpeech.js
│       ├── timelineRenderer.js
│       ├── uiManager.js
│       ├── tabManager.js
│       ├── domElements.js
│       ├── debugLogger.js
│       ├── vibeLogger.js
│       └── debugUI.js
│
├── AddSlider/                      # 🗑️ 削除予定（実験版）
├── css/                            # 🗑️ 削除予定（レガシー版スタイル）
├── js/                             # 🗑️ 削除予定（レガシー版スクリプト）
│   ├── kuromojiManager.js          # 🗑️ kuromoji関連
│   └── ...
├── img/                            # 🗑️ 削除予定（スクリーンショット）
├── index.html                      # 🗑️ 削除予定（レガシー版HTML）
├── speak.js                        # 🗑️ 削除予定（重複ファイル）
├── UI希望.png                      # 🗑️ 削除予定
│
├── docs/                           # ✅ 保持（機能拡張計画）
│   └── feature_flows.md
├── README.md                       # ✅ 保持
├── CLAUDE.md                       # ✅ 保持
├── DEBUG.md                        # ✅ 保持
├── package.json                    # ✅ 保持（kuromoji削除後）
└── package-lock.json               # ✅ 保持
```

### 削除後の理想構造

```
/
├── minutes/                        # メイン版（AI議事録アプリ）
│   ├── index.html
│   ├── speak.js
│   ├── css/
│   │   ├── style.css
│   │   └── history.css
│   └── js/
│       ├── main.js
│       ├── geminiManager.js
│       ├── speechRecognition.js
│       ├── textToSpeech.js
│       ├── timelineRenderer.js
│       ├── uiManager.js
│       ├── tabManager.js
│       ├── domElements.js
│       ├── debugLogger.js
│       ├── vibeLogger.js
│       └── debugUI.js
│
├── docs/                           # ドキュメント
│   └── feature_flows.md
├── README.md
├── CLAUDE.md
├── DEBUG.md
├── package.json
└── package-lock.json
```

---

## アーキテクチャ

### メイン版（`/minutes/`） - モジュラーアーキテクチャ

**クラスベース設計による関心の分離**

| モジュール | 役割 |
|-----------|------|
| `main.js` | アプリケーション全体の統括・初期化 |
| `geminiManager.js` | Gemini API通信・要約・話者識別 |
| `speechRecognition.js` | Web Speech API管理・音声認識 |
| `textToSpeech.js` | 音声合成機能 |
| `timelineRenderer.js` | タイムライン描画・インライン編集 |
| `uiManager.js` | UI状態管理・表示制御 |
| `tabManager.js` | タブ切り替え・履歴管理 |
| `domElements.js` | DOM要素キャッシュ・アクセス |
| `debugLogger.js` | 5レベルデバッグログ |
| `vibeLogger.js` | AI可読構造化ログ |
| `debugUI.js` | リアルタイムデバッグパネル |

### 音声認識 + AI処理フロー

1. **初期化**: Gemini APIキーの検証
2. **音声認識開始**: 日本語（`ja-JP`）でWeb Speech APIセットアップ
3. **リアルタイム文字起こし**: 暫定・最終結果の継続的な表示
4. **AI要約**: Gemini APIで会議内容を要約
5. **話者識別**: 発言を話者別に自動分類
6. **タイムライン表示**: 話者ごとに色分けして時系列表示
7. **データ保存**: 履歴・JSON/TXT形式でエクスポート

---

## 開発ワークフロー

### よくある作業パターン

#### 🔧 新機能開発
```bash
# 1. ローカル開発サーバー起動
npm run serve
# → http://localhost:8000/minutes/?debug=DEBUG&debugUI=true

# 2. Gemini APIキーを設定してテスト
# UIからAPIキーを入力・検証

# 3. 該当モジュールを編集
# 例: AI機能 → minutes/js/geminiManager.js
# 例: タイムライン → minutes/js/timelineRenderer.js

# 4. コミット＆プッシュ（承認後）
git add minutes/
git commit -m "機能: 〇〇を追加"
git push -u origin <ブランチ名>
```

#### 🐛 バグ修正
```bash
# 1. 問題の切り分け
# - 音声認識の問題 → minutes/js/speechRecognition.js
# - Gemini API問題 → minutes/js/geminiManager.js
# - UI/タイムライン問題 → minutes/js/timelineRenderer.js

# 2. デバッグログ確認
# ブラウザDevToolsコンソール + Ctrl+Dでデバッグパネル

# 3. 修正実装・確認・コミット
```

#### 🗑️ レガシー機能削除
```bash
# レガシーファイル・フォルダを削除する場合
git rm -r AddSlider/ css/ js/ img/
git rm index.html speak.js UI希望.png

# package.jsonからkuromojiを削除
# → package.jsonを編集してkuromoji依存を削除

# node_modulesを再インストール
npm install

# コミット
git commit -m "削除: レガシー機能（kuromoji含む）を削除"
git push -u origin <ブランチ名>
```

### Gemini API設定（重要）

メイン版の開発には**Gemini APIキー**が必須です。

1. [Google AI Studio](https://aistudio.google.com/app/apikey)でAPIキーを取得
2. アプリ上部の「gemini-api-key」フィールドに入力
3. 「APIキー確認」ボタンで検証
4. モデル選択（デフォルト: gemini-2.5-flash）

**注意**: APIキーはコミットしないこと（`.env`ファイルも`.gitignore`推奨）

---

## デバッグ戦略

### ログレベル使い分け
- **ERROR**: 致命的エラー（本番でも記録）
- **WARN**: 警告・非推奨機能
- **INFO**: 重要なイベント（本番推奨）
- **DEBUG**: 開発時詳細ログ（開発推奨）
- **TRACE**: 超詳細ログ（問題調査時のみ）

### デバッグツール

| ツール | 説明 | 使い方 |
|--------|------|--------|
| debugLogger | 5レベルログ（ERROR/WARN/INFO/DEBUG/TRACE） | 各モジュールで自動記録 |
| debugUI | リアルタイムデバッグパネル | Ctrl+D または `?debugUI=true` |
| vibeLogger | AI可読構造化ログ | 重要操作で自動記録 |
| DevTools | ブラウザコンソール | F12キーで開く |

### ベストプラクティス

✅ **やるべきこと**
- 重要な処理（Gemini API呼び出しなど）にvibeloggerを追加
- Gemini APIのレート制限・トークン使用量を監視
- 開発中はデバッグUIを有効化（`?debug=DEBUG&debugUI=true`）
- ブラウザDevToolsのコンソールで詳細確認

❌ **避けるべきこと**
- 本番環境でDEBUG/TRACEレベル有効化（パフォーマンス低下）
- Gemini APIキーのハードコード・コミット
- ログなしでの複雑な機能実装
- デバッグコードのコミット（console.logなど）

---

## Git & デプロイメント

### ブランチ戦略
- 作業ブランチ: `claude/` プレフィックス（例: `claude/feature-name-01ABC`）
- プッシュ: `git push -u origin <ブランチ名>`
- ⚠️ ブランチ名が正しくないと403エラー

### デプロイフロー
```
ローカル編集 → Git commit → Git push → GitHub Actions → さくらサーバー
```

### 🚫 禁止事項
- WinSCPでさくらサーバーへ直接アップロード
- main/masterへのforce push
- 指定外のブランチへのpush
- Gemini APIキーのコミット

---

## 技術スタック & 制約

### 依存関係（メイン版）
- **Google Gemini API** - AI要約・話者識別
- **Web Speech API** - 音声認識
- **vibelogger** ^0.1.0 - AI可読構造化ログ
- ESM CDN経由で`@google/genai`をインポート

### ビルド
- **ビルドプロセス不要** - 純粋なフロントエンドアプリ
- 直接ブラウザで開いて動作可能
- ローカル開発は `npm run serve` 推奨

### ブラウザ要件
- **対応**: Chrome/Chromiumベースブラウザ（Web Speech API制限）
- **マイクアクセス**: 必須（音声認識用）
- **HTTPS**: 本番環境では必須（マイク許可要件）
- **言語設定**: 日本語（`ja-JP`）

### パフォーマンス特性
- 音声認識: リアルタイム処理
- Gemini API: レート制限・トークン制限あり（要監視）
- タイムライン描画: 大量発言時のパフォーマンス考慮
- デバッグログ: レベル調整でオーバーヘッド制御

### 既知の問題・技術的負債
- ~~レガシー機能が残存（削除予定）~~ ✅ **削除済み**（2025-12-18）
- Gemini APIトークン使用量の可視化改善余地あり
- **話者識別JSON表示エリアが意図的に無効化中**
  - `minutes/index.html:94-99`で`speaker-json-container`と`speaker-json-result`がコメントアウト済み
  - そのため、DOMElementsから「オプショナル要素が見つかりません」のWARNINGが出るが、**これは正常動作**
  - 必要に応じて`minutes/index.html:94-99`のコメントを解除すれば、JSON表示エリアが復活
  - 話者識別機能自体は動作中（タイムライン表示は有効）

---

## トラブルシューティング

### 音声認識が動かない
1. ブラウザがChrome/Chromiumベースか確認
2. マイク許可を確認
3. DevToolsコンソールでエラー確認
4. デバッグUI（Ctrl+D）でステータス確認

### Gemini API関連エラー
1. APIキーの有効性を確認
2. レート制限・クォータを確認（Google AI Studioで確認）
3. `minutes/js/geminiManager.js`のエラーハンドリング確認
4. DevToolsコンソールでAPI応答を確認

### タイムライン表示の問題
1. 話者識別が完了しているか確認
2. `minutes/js/timelineRenderer.js`のログ確認
3. データ構造が正しいかDevToolsで確認

### デプロイが失敗
1. ブランチ名が `claude/` で始まっているか確認
2. GitHub Actionsのログ確認
3. Git pushが成功しているか確認
4. ネットワークエラーは指数バックオフで再試行

### WARNINGログ: 「オプショナル要素が見つかりません (speakerJsonResult, speakerJsonContainer)」
**これは正常動作です。** 話者識別のJSON表示エリアを意図的に無効化しています。
- 話者識別機能自体は正常に動作（タイムライン表示は有効）
- JSON表示を有効にする場合: `minutes/index.html:94-99`のコメントを解除
- このWARNINGは無視して問題なし

---

## 参考情報

### 関連ドキュメント

- `/docs/feature_flows.md` - 議事録機能拡張フロー（UI改善、要約、話者識別の段階的導入計画）
- `README.md` - プロジェクト概要・セットアップ手順
- `DEBUG.md` - デバッグ詳細情報

### レガシー機能について

**kuromoji.js**を含むレガシー機能は削除予定です。これらのファイル・フォルダは参照しないでください：

- `/AddSlider/` - 実験版
- `/css/`, `/js/` - レガシー版スクリプト・スタイル
- `/index.html` - レガシー版HTML

**開発方針**: 全ての新機能はメイン版（`/minutes/`）で開発してください。
