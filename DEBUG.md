# WebSpeech デバッグ機能ガイド

このドキュメントでは、WebSpeechアプリケーションのデバッグ機能について説明します。

## デバッグ機能の概要

WebSpeechアプリケーションには包括的なデバッグシステムが統合されており、開発者がアプリケーションの動作を詳細に監視・分析できます。

### 主な機能

1. **リアルタイムログ表示** - ブラウザコンソールとデバッグパネルでのログ表示
2. **ログレベル制御** - ERROR, WARN, INFO, DEBUG, TRACEの5段階
3. **パフォーマンス測定** - 処理時間とメモリ使用量の監視
4. **ログエクスポート** - JSON/CSV/TXT形式でのログ出力
5. **リアルタイムUI** - ドラッグ可能なデバッグパネル

## デバッグ機能の有効化

### 1. URLパラメータによる有効化

```
# デバッグレベルをDEBUGに設定
http://localhost/index.html?debug=DEBUG

# デバッグUIを自動表示
http://localhost/index.html?debugUI=true

# 複数パラメータの組み合わせ
http://localhost/index.html?debug=TRACE&debugUI=true
```

### 2. キーボードショートカット

- **Ctrl + D**: デバッグパネルの表示/非表示切り替え
- **Ctrl + Shift + D**: コンソールにデバッグ情報を表示

### 3. コンソールコマンド

```javascript
// デバッグ情報の表示
debugLogger.showDebugInfo()

// ログレベルの変更
debugLogger.setLogLevel('DEBUG')

// ログ履歴の取得
debugLogger.getHistory()

// ログ履歴のクリア
debugLogger.clearHistory()

// 設定の変更
debugLogger.configure({
    logLevel: 'TRACE',
    enableTimestamp: true,
    enableStackTrace: true
})

// アプリケーション状態の確認
webSpeechApp.getAppState()
webSpeechApp.getDebugInfo()
```

## ログレベル詳細

| レベル | 用途 | 内容例 |
|--------|------|--------|
| ERROR | エラー | 音声認識エラー、kuromoji初期化失敗 |
| WARN | 警告 | CDN接続失敗、ブラウザ非対応 |
| INFO | 情報 | 初期化完了、状態変更 |
| DEBUG | デバッグ | 詳細な処理フロー、設定値 |
| TRACE | トレース | 細かい処理ステップ、API呼び出し |

## デバッグパネルの使い方

### パネルの表示
1. `Ctrl + D` を押すか、URLに `?debugUI=true` を追加
2. パネルは右上に表示され、ドラッグで移動可能

### パネルの機能
- **ログレベル選択**: リアルタイムでログの表示レベルを変更
- **履歴クリア**: 蓄積されたログ履歴をクリア
- **エクスポート**: ログをファイルとしてダウンロード
- **リアルタイム統計**: アプリ状態、ログ件数、メモリ使用量
- **ログ表示**: 最新20件のログをリアルタイム表示

## モジュール別デバッグ情報

### SpeechRecognition
- 音声認識の開始/停止
- 認識結果の受信と処理
- エラー状況の詳細

### KuromojiManager
- 辞書ファイルの読み込み状況
- 初期化処理の進捗
- ひらがな変換の詳細

### WebSpeechApp
- 全体的な初期化フロー
- モジュール間の連携状況
- エラーハンドリング

### UIManager
- UI状態の変更
- ボタンの有効/無効化
- プログレスバーの更新

## パフォーマンス監視

### 処理時間の測定
```javascript
// タイマー開始
debugLogger.time('ProcessName')

// 処理実行...

// タイマー終了（結果をログ出力）
debugLogger.timeEnd('ProcessName')
```

### メモリ使用量
デバッグパネルでリアルタイムにJavaScriptヒープの使用状況を監視できます。

## ログのエクスポート

### 手動エクスポート
デバッグパネルの「エクスポート」ボタンをクリック

### プログラムでのエクスポート
```javascript
// JSON形式
const jsonLogs = debugLogger.exportHistory('json')

// CSV形式
const csvLogs = debugLogger.exportHistory('csv')

// テキスト形式
const textLogs = debugLogger.exportHistory('txt')
```

## トラブルシューティング

### よくある問題

1. **デバッグパネルが表示されない**
   - `Ctrl + D` を押す
   - URLに `?debugUI=true` を追加
   - ブラウザの開発者ツールでJavaScriptエラーを確認

2. **ログが出力されない**
   - ログレベルを確認（DEBUGまたはTRACEに設定）
   - `debugLogger` オブジェクトが正しく初期化されているか確認

3. **パフォーマンス情報が表示されない**
   - Chrome系ブラウザでのみ利用可能
   - `performance.memory` API の対応状況を確認

### デバッグの最適実践

1. **段階的なログレベル**: 開発時はDEBUG、本番前はINFO
2. **定期的なログクリア**: 長時間のテストでメモリ使用量を抑制
3. **エラー時のエクスポート**: 問題発生時は即座にログをエクスポート
4. **パフォーマンス監視**: 重い処理にはtime/timeEndを活用

## 設定のカスタマイズ

```javascript
// デバッグ設定の変更例
debugLogger.configure({
    logLevel: 'DEBUG',           // ログレベル
    enableConsoleLog: true,      // コンソール出力
    enableTimestamp: true,       // タイムスタンプ表示
    enableStackTrace: false,     // スタックトレース（ERROR時）
    maxHistorySize: 1000        // 履歴の最大件数
})
```

## 本番環境での注意事項

- デバッグ機能は開発・テスト環境でのみ使用してください
- 本番環境では `debugLogger.configure({ logLevel: 'ERROR' })` を設定
- 大量のログ出力はパフォーマンスに影響する可能性があります