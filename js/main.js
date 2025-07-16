// メインアプリケーションクラス
class WebSpeechApp {
    constructor() {
        this.domElements = null;
        this.speechRecognition = null;
        this.kuromojiManager = null;
        this.textToSpeech = null;
        this.tabManager = null;
        this.uiManager = null;
        this.logger = window.debugLogger;
        this.vibeLogger = window.vibeLogger;
        
        this.isInitialized = false;
        
        this.logger.info('WebSpeechApp', 'WebSpeechApp初期化開始');
        this.vibeLogger.info('WebSpeechApp', 'WebSpeechApp初期化開始', {
            humanNote: 'WebSpeechAppのメインクラスの初期化を開始しました',
            aiTodo: 'すべてのコンポーネントが正常に初期化されることを確認してください'
        });
    }

    async init() {
        try {
            this.logger.info('WebSpeechApp', 'WebSpeechApp初期化開始');
            this.logger.time('WebSpeechAppInitialization');
            
            // DOM要素の初期化
            this.logger.debug('WebSpeechApp', 'DOM要素初期化開始');
            this.domElements = new DOMElements();
            if (!this.domElements.validateElements()) {
                throw new Error('Required DOM elements are missing');
            }
            this.logger.debug('WebSpeechApp', 'DOM要素初期化完了');
            
            // UI管理の初期化
            this.logger.debug('WebSpeechApp', 'UI管理初期化開始');
            this.uiManager = new UIManager();
            this.uiManager.setElements(this.domElements);
            this.logger.debug('WebSpeechApp', 'UI管理初期化完了');
            
            // タブ管理の初期化
            this.logger.debug('WebSpeechApp', 'タブ管理初期化開始');
            this.tabManager = new TabManager();
            this.tabManager.setElements(this.domElements);
            this.setupTabManagerCallbacks();
            this.logger.debug('WebSpeechApp', 'タブ管理初期化完了');
            
            // 音声合成の初期化
            this.logger.debug('WebSpeechApp', '音声合成初期化開始');
            this.textToSpeech = new TextToSpeechManager();
            this.setupTextToSpeechCallbacks();
            this.logger.debug('WebSpeechApp', '音声合成初期化完了');
            
            // 音声認識の初期化
            this.logger.debug('WebSpeechApp', '音声認識初期化開始');
            this.speechRecognition = new SpeechRecognitionManager();
            if (!this.speechRecognition.recognition) {
                this.handleSpeechRecognitionNotSupported();
                return;
            }
            this.setupSpeechRecognitionCallbacks();
            this.logger.debug('WebSpeechApp', '音声認識初期化完了');
            
            // kuromoji管理の初期化
            this.logger.debug('WebSpeechApp', 'kuromoji管理初期化開始');
            this.kuromojiManager = new KuromojiManager();
            this.setupKuromojiCallbacks();
            this.logger.debug('WebSpeechApp', 'kuromoji管理初期化完了');
            
            // イベントリスナーの設定
            this.logger.debug('WebSpeechApp', 'イベントリスナー設定開始');
            this.setupEventListeners();
            this.logger.debug('WebSpeechApp', 'イベントリスナー設定完了');
            
            // kuromoji初期化の開始
            this.logger.debug('WebSpeechApp', 'kuromoji初期化開始');
            await this.kuromojiManager.initialize();
            this.logger.debug('WebSpeechApp', 'kuromoji初期化完了');
            
            this.isInitialized = true;
            const duration = this.logger.timeEnd('WebSpeechAppInitialization');
            this.logger.info('WebSpeechApp', 'WebSpeechApp初期化完了', { duration });
            
        } catch (error) {
            this.logger.timeEnd('WebSpeechAppInitialization');
            this.logger.error('WebSpeechApp', 'WebSpeechApp初期化失敗', error);
            if (this.uiManager) {
                this.uiManager.showError('アプリケーションの初期化に失敗しました: ' + error.message);
            }
        }
    }

    setupSpeechRecognitionCallbacks() {
        this.speechRecognition.setOnResultCallback((result) => {
            this.handleSpeechRecognitionResult(result);
        });
        
        this.speechRecognition.setOnStatusCallback((status) => {
            this.uiManager.showStatus(status);
        });
        
        this.speechRecognition.setOnStateChangeCallback((state) => {
            this.handleSpeechRecognitionStateChange(state);
        });
    }

    setupKuromojiCallbacks() {
        this.kuromojiManager.setOnStatusCallback((status) => {
            this.uiManager.showKuromojiStatus(status);
        });
        
        this.kuromojiManager.setOnProgressCallback((progress) => {
            this.uiManager.updateProgress(progress);
        });
        
        this.kuromojiManager.setOnInitializedCallback(() => {
            this.uiManager.setKuromojiReadyState();
        });
        
        this.kuromojiManager.setOnErrorCallback((error) => {
            this.uiManager.showKuromojiStatus(error.message, 'error');
            this.uiManager.setKuromojiErrorState();
        });
    }

    setupTextToSpeechCallbacks() {
        this.textToSpeech.setOnSpeechStartCallback(() => {
            // 音声認識が動作中の場合は一時停止
            if (this.speechRecognition.isRecognizing()) {
                this.speechRecognition.stop();
            }
        });
        
        this.textToSpeech.setOnSpeechEndCallback(() => {
            // 音声合成終了後に音声認識を再開
            if (this.speechRecognition.resumeAfterSpeechSynthesis) {
                setTimeout(() => {
                    this.speechRecognition.resumeAfterSpeechSynthesis();
                }, 500);
            }
        });
    }

    setupTabManagerCallbacks() {
        // 履歴出力ボタンのコールバック
        this.tabManager.setOnHistoryOutputCallback((text, hiragana, index) => {
            this.handleHistoryOutput(text, hiragana, index);
        });
        
        // 履歴削除ボタンのコールバック
        this.tabManager.setOnHistoryDeleteCallback((deletedItem, index) => {
            this.handleHistoryDelete(deletedItem, index);
        });
    }

    setupEventListeners() {
        // 音声認識制御ボタン
        const startButton = this.domElements.get('startButton');
        const stopButton = this.domElements.get('stopButton');
        const retryButton = this.domElements.get('retryButton');
        const clearButton = this.domElements.get('clearButton');
        
        if (startButton) {
            startButton.addEventListener('click', () => this.handleStartRecognition());
        }
        
        if (stopButton) {
            stopButton.addEventListener('click', () => this.handleStopRecognition());
        }
        
        if (retryButton) {
            retryButton.addEventListener('click', () => this.handleRetryKuromoji());
        }
        
        if (clearButton) {
            clearButton.addEventListener('click', () => this.handleClearResults());
        }
        
        // 読み上げボタン
        const speakAllButton = this.domElements.get('speakAllButton');
        const speakNewButton = this.domElements.get('speakNewButton');
        
        if (speakAllButton) {
            speakAllButton.addEventListener('click', () => this.handleSpeakAll());
        }
        
        if (speakNewButton) {
            speakNewButton.addEventListener('click', () => this.handleSpeakNew());
        }
        
        // 履歴タブ操作
        const historyClear = this.domElements.get('historyClear');
        const historySearch = this.domElements.get('historySearch');
        const historyExport = this.domElements.get('historyExport');
        const historyImport = this.domElements.get('historyImport');
        
        if (historyClear) {
            historyClear.addEventListener('click', () => {
                if (confirm('履歴をすべて削除しますか？')) {
                    this.tabManager.clearHistory();
                }
            });
        }
        if (historySearch) {
            historySearch.addEventListener('input', (e) => {
                const query = e.target.value;
                const results = this.tabManager.searchHistory(query);
                this.tabManager.renderHistory(results);
            });
        }
        if (historyExport) {
            historyExport.addEventListener('click', () => {
                const data = this.tabManager.exportHistory('json');
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'history.json';
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 100);
            });
        }
        if (historyImport) {
            historyImport.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (evt) => {
                    try {
                        const text = evt.target.result;
                        const ok = this.tabManager.importHistory(text, 'json');
                        if (ok) {
                            alert('履歴をインポートしました');
                            this.tabManager.renderHistory();
                        } else {
                            alert('インポートに失敗しました');
                        }
                    } catch (err) {
                        alert('インポートエラー: ' + err.message);
                    }
                };
                reader.readAsText(file);
                // ファイル選択状態をリセット
                e.target.value = '';
            });
        }
    }

    handleStartRecognition() {
        if (!this.speechRecognition.start()) {
            this.uiManager.showError('音声認識を開始できませんでした。');
        }
    }

    handleStopRecognition() {
        this.speechRecognition.stop();
    }

    async handleRetryKuromoji() {
        try {
            this.uiManager.setKuromojiInitializingState();
            await this.kuromojiManager.reinitialize();
        } catch (error) {
            console.error('Kuromoji retry failed:', error);
            this.uiManager.showError('kuromoji再初期化に失敗しました: ' + error.message);
        }
    }

    handleClearResults() {
        // クリア前に現在のテキストとひらがなを履歴に保存
        const currentText = this.domElements.get('resultTextElement').textContent.trim();
        const currentHiragana = this.domElements.get('hiraganaTextElement').textContent.trim();
        
        if (currentText && currentText !== 'ここに認識されたテキストが表示されます...') {
            this.tabManager.addToHistoryWithHiragana(currentText, currentHiragana);
        }
        
        this.speechRecognition.clearResults();
        this.uiManager.clearResults();
        this.textToSpeech.clearHistory();
    }

    handleSpeakAll() {
        const originalText = this.domElements.get('resultTextElement').textContent.trim();
        const hiraganaText = this.domElements.get('hiraganaTextElement').textContent.trim();
        const mode = this.uiManager.getSpeakMode();
        
        this.textToSpeech.speakAll(originalText, hiraganaText, mode);
    }

    handleSpeakNew() {
        const originalText = this.domElements.get('resultTextElement').textContent.trim();
        const hiraganaText = this.domElements.get('hiraganaTextElement').textContent.trim();
        const mode = this.uiManager.getSpeakMode();
        
        this.textToSpeech.speakNew(originalText, hiraganaText, mode);
    }

    handleHistoryOutput(text, hiragana, index) {
        // 履歴のテキストをメインエリアに出力
        this.uiManager.displayResult(text);
        if (hiragana) {
            this.uiManager.displayHiragana(hiragana);
        } else {
            this.uiManager.displayHiragana('');
        }
        
        // メインタブに切り替え
        this.tabManager.switchTab('main');
        
        console.log('History item output:', { text, hiragana, index });
    }

    handleHistoryDelete(deletedItem, index) {
        console.log('History item deleted:', { deletedItem, index });
        // 必要に応じて追加の処理を実装
    }

    handleSpeechRecognitionResult(result) {
        const { finalTranscript, interimTranscript, newFinalPortion } = result;
        
        // 結果をUI上に表示
        this.uiManager.displayResult(finalTranscript, interimTranscript);
        
        // ひらがな変換の処理
        if (finalTranscript && this.kuromojiManager.isReady()) {
            const hiraganaResult = this.kuromojiManager.convertToHiragana(finalTranscript);
            this.uiManager.displayHiragana(hiraganaResult);
        } else if (finalTranscript && !this.kuromojiManager.isReady()) {
            this.uiManager.displayHiragana(finalTranscript + ' (かな変換待機中...)');
        } else if (!finalTranscript && !interimTranscript) {
            this.uiManager.displayHiragana('');
        }
        
        // 履歴への追加機能を削除（クリアボタンでのみ履歴に追加）
    }

    handleSpeechRecognitionStateChange(state) {
        switch (state) {
            case 'started':
                this.uiManager.setRecognitionStartState();
                break;
            case 'ended':
                this.uiManager.setRecognitionStopState(this.kuromojiManager.isReady());
                break;
        }
    }

    handleSpeechRecognitionNotSupported() {
        this.uiManager.showStatus('ステータス: お使いのブラウザは Web Speech API に対応していません。', 'error');
        this.uiManager.showKuromojiStatus('', 'info');
        this.uiManager.setMultipleButtonStates({
            'startButton': false,
            'stopButton': false
        });
        
        alert('お使いのブラウザは Web Speech API に対応していません。');
    }

    // アプリケーションの状態を取得
    getAppState() {
        return {
            isInitialized: this.isInitialized,
            isRecognizing: this.speechRecognition?.isRecognizing() || false,
            isKuromojiReady: this.kuromojiManager?.isReady() || false,
            isSpeaking: this.textToSpeech?.isSpeaking() || false,
            currentTab: this.tabManager?.getCurrentTab() || 'main',
            historyCount: this.tabManager?.getHistory().length || 0
        };
    }

    // デバッグ用の情報取得
    getDebugInfo() {
        return {
            appState: this.getAppState(),
            domElementsValid: this.domElements?.validateElements() || false,
            speechRecognitionSupported: SpeechRecognitionManager.isSupported(),
            textToSpeechSupported: TextToSpeechManager.isSupported(),
            historyStats: this.tabManager?.getHistoryStats() || {}
        };
    }
}

// グローバル変数として初期化
let webSpeechApp = null;

// ページ読み込み時の初期化
window.addEventListener('load', async () => {
    console.log('Page loaded, initializing WebSpeechApp...');
    
    try {
        webSpeechApp = new WebSpeechApp();
        await webSpeechApp.init();
        
        // デバッグ情報をコンソールに出力
        console.log('WebSpeechApp Debug Info:', webSpeechApp.getDebugInfo());
        
        // ページリロード時の履歴保存機能を削除（クリアボタンでのみ履歴に追加）
        
    } catch (error) {
        console.error('Failed to initialize application:', error);
        alert('アプリケーションの初期化に失敗しました。ページを再読み込みしてください。');
    }
});

// エラーハンドリング
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (webSpeechApp && webSpeechApp.uiManager) {
        webSpeechApp.uiManager.showError('予期しないエラーが発生しました: ' + event.error.message);
    }
});

// 未処理のPromise拒否のハンドリング
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (webSpeechApp && webSpeechApp.uiManager) {
        webSpeechApp.uiManager.showError('非同期処理でエラーが発生しました: ' + event.reason);
    }
});

// デバッグ用にグローバルスコープでアクセス可能にする
window.webSpeechApp = webSpeechApp;