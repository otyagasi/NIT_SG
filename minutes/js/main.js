// メインアプリケーションクラス
class WebSpeechApp {
    constructor() {
        this.domElements = null;
        this.speechRecognition = null;
        this.textToSpeech = null;
        this.tabManager = null;
        this.timelineManager = null;
        this.uiManager = null;
        this.geminiManager = null;
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
            
            // タイムライン機能は無効化（UIのみ残す）
            
            // 音声合成の初期化（オプション）
            if (typeof TextToSpeechManager !== 'undefined') {
                this.logger.debug('WebSpeechApp', '音声合成初期化開始');
                this.textToSpeech = new TextToSpeechManager();
                this.setupTextToSpeechCallbacks();
                this.logger.debug('WebSpeechApp', '音声合成初期化完了');
            } else {
                this.logger.debug('WebSpeechApp', '音声合成機能はスキップされました');
            }
            
            // 音声認識の初期化
            this.logger.debug('WebSpeechApp', '音声認識初期化開始');
            this.speechRecognition = new SpeechRecognitionManager();
            if (!this.speechRecognition.recognition) {
                this.handleSpeechRecognitionNotSupported();
                return;
            }
            this.setupSpeechRecognitionCallbacks();
            this.logger.debug('WebSpeechApp', '音声認識初期化完了');

            // Gemini管理の初期化
            this.logger.debug('WebSpeechApp', 'Gemini管理初期化開始');
            this.geminiManager = new GeminiManager();
            this.setupGeminiCallbacks();
            this.logger.debug('WebSpeechApp', 'Gemini管理初期化完了');

            // イベントリスナーの設定
            this.logger.debug('WebSpeechApp', 'イベントリスナー設定開始');
            this.setupEventListeners();
            this.logger.debug('WebSpeechApp', 'イベントリスナー設定完了');

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

    setupTextToSpeechCallbacks() {
        if (!this.textToSpeech) {
            return;
        }
        
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
        
        // 音声選択機能の初期化（遅延実行）
        setTimeout(() => {
            if (this.textToSpeech) {
                this.textToSpeech.initializeVoices();
                const voiceSelect = this.domElements.get('voiceSelect');
                if (voiceSelect) {
                    this.textToSpeech.initializeVoiceSelect(voiceSelect);
                }
            }
        }, 500);
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

    setupGeminiCallbacks() {
        // ステータス更新コールバック
        this.geminiManager.setOnStatusCallback((message, type) => {
            this.handleGeminiStatus(message, type);
        });

        // トークン更新コールバック
        this.geminiManager.setOnTokenUpdateCallback((usageMetadata) => {
            this.handleTokenUpdate(usageMetadata);
        });

        // レート制限更新コールバック
        this.geminiManager.setOnRateLimitUpdateCallback((rateLimitStats) => {
            this.handleRateLimitUpdate(rateLimitStats);
        });

        // LocalStorageからAPIキーを読み込み
        this.geminiManager.loadApiKeyFromStorage();

        // APIキーが保存されていればUI入力欄に表示
        const apiKeyInput = this.domElements.get('geminiApiKeyInput');
        if (apiKeyInput && this.geminiManager.hasApiKey()) {
            apiKeyInput.value = this.geminiManager.getApiKey();
        }
    }


    setupEventListeners() {
        // 音声認識制御ボタン
        const startButton = this.domElements.get('startButton');
        const stopButton = this.domElements.get('stopButton');
        const clearButton = this.domElements.get('clearButton');
        const saveHistoryButton = this.domElements.get('saveHistoryButton');

        if (startButton) {
            startButton.addEventListener('click', () => this.handleStartRecognition());
        }

        if (stopButton) {
            stopButton.addEventListener('click', () => this.handleStopRecognition());
        }

        if (clearButton) {
            clearButton.addEventListener('click', () => this.handleClearResults());
        }
        
        if (saveHistoryButton) {
            saveHistoryButton.addEventListener('click', () => this.handleSaveToHistory());
        }
        
        // TXT保存ボタン
        const saveTxtButton = this.domElements.get('saveTxt');
        if (saveTxtButton) {
            saveTxtButton.addEventListener('click', () => this.handleSaveTxt());
        }
        
        // 読み上げボタン
        const speakAllButton = this.domElements.get('speakAllButton');
        const speakNewButton = this.domElements.get('speakNewButton');
        const speakStopButton = this.domElements.get('speakStopButton');
        
        if (speakAllButton) {
            speakAllButton.addEventListener('click', () => this.handleSpeakAll());
        }
        
        if (speakNewButton) {
            speakNewButton.addEventListener('click', () => this.handleSpeakNew());
        }
        
        if (speakStopButton) {
            speakStopButton.addEventListener('click', () => this.handleSpeakStop());
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

        // Gemini API関連のイベントリスナー
        const verifyApiKeyButton = this.domElements.get('verifyApiKeyButton');
        const geminiApiKeyInput = this.domElements.get('geminiApiKeyInput');

        if (verifyApiKeyButton) {
            verifyApiKeyButton.addEventListener('click', () => this.handleVerifyApiKey());
        }

        // APIキー入力でEnterキー押下時に検証
        if (geminiApiKeyInput) {
            geminiApiKeyInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleVerifyApiKey();
                }
            });
        }

        // 要約ボタン
        const summarizeButton = this.domElements.get('summarizeButton');
        if (summarizeButton) {
            summarizeButton.addEventListener('click', () => this.handleSummarizeText());
        }

        // 話者識別ボタン
        const identifySpeakersButton = this.domElements.get('identifySpeakersButton');
        if (identifySpeakersButton) {
            identifySpeakersButton.addEventListener('click', () => this.handleIdentifySpeakers());
        }
    }

    handleStartRecognition() {
        // リセット機能を完全に削除 - 常に継続モードで開始
        const ok = this.speechRecognition.start();
        // タイムラインの録音UIを同期
        if (this.timelineManager) {
            this.timelineManager.setRecordingUI(ok);
        }
        if (!ok) {
            this.uiManager.showError('音声認識を開始できませんでした。');
        }
    }

    handleStopRecognition() {
        this.speechRecognition.stop();
        // タイムラインの録音UIを同期
        if (this.timelineManager) {
            this.timelineManager.setRecordingUI(false);
        }
    }

    handleClearResults() {
        // クリア機能は履歴保存なしでテキストのみクリア
        this.speechRecognition.clearResults();
        this.uiManager.clearResults();
        if (this.textToSpeech) {
            this.textToSpeech.clearHistory();
        }
    }

    handleSaveToHistory() {
        // 現在のテキストを履歴に保存
        const currentText = this.domElements.get('resultTextElement').textContent.trim();

        // プレースホルダーテキストは保存しない
        const cleanCurrentText = currentText === 'ここに認識されたテキストが表示されます...' ? '' : currentText;

        if (cleanCurrentText) {
            this.tabManager.addToHistory(cleanCurrentText);
            console.log('Text saved to history manually:', {
                original: cleanCurrentText
            });

            // 保存完了の通知
            this.uiManager.showStatus('ステータス: 履歴に保存しました', 'success');
        } else {
            this.uiManager.showStatus('ステータス: 保存するテキストがありません', 'info');
        }
    }

    handleSaveTxt() {
        // 現在のテキストを取得
        const currentText = this.domElements.get('resultTextElement').textContent.trim();

        // プレースホルダーテキストは保存しない
        const cleanCurrentText = currentText === 'ここに認識されたテキストが表示されます...' ? '' : currentText;

        if (!cleanCurrentText) {
            this.uiManager.showStatus('ステータス: 保存するテキストがありません', 'info');
            return;
        }

        // TXTファイルの内容を作成
        let txtContent = '';

        if (cleanCurrentText) {
            txtContent += cleanCurrentText + '\n';
        }

        // ファイル名を生成（日時ベース）
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 19).replace(/[T:]/g, '-');
        const fileName = `speech-text-${dateStr}.txt`;
        
        // ダウンロード処理
        const blob = new Blob([txtContent], { type: 'text/plain; charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        
        // クリーンアップ
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        console.log('Speech text saved as TXT file:', fileName);
        this.uiManager.showStatus('ステータス: TXTファイルを保存しました', 'success');
    }

    handleSpeakAll() {
        if (!this.textToSpeech) {
            this.uiManager.showStatus('ステータス: 音声合成機能は利用できません', 'info');
            return;
        }
        const originalText = this.domElements.get('resultTextElement').textContent.trim();
        
        this.textToSpeech.speakAll(originalText, hiraganaText, 'original');
    }

    handleSpeakNew() {
        if (!this.textToSpeech) {
            this.uiManager.showStatus('ステータス: 音声合成機能は利用できません', 'info');
            return;
        }
        const originalText = this.domElements.get('resultTextElement').textContent.trim();
        
        this.textToSpeech.speakNew(originalText, hiraganaText, 'original');
    }

    handleSpeakStop() {
        if (!this.textToSpeech) {
            this.uiManager.showStatus('ステータス: 音声合成機能は利用できません', 'info');
            return;
        }
        if (this.textToSpeech.stop()) {
            this.uiManager.showStatus('ステータス: 読み上げを停止しました', 'info');
        } else {
            this.uiManager.showStatus('ステータス: 停止する読み上げがありません', 'info');
        }
    }

    handleHistoryOutput(text, hiragana, index) {
        // 履歴のテキストを既存のテキストに追加（上書きではなく追加）
        const currentFinalText = "";
        const newFinalText = currentFinalText + (currentFinalText ? '\n' : '') + text;
        
        // Speech Recognitionの内部状態を更新
        this.speechRecognition.setFinalTranscript(newFinalText);
        
        // UIに表示
        this.uiManager.displayResult(newFinalText);
        
        if (hiragana) {
            // 現在のUIのひらがなテキストを取得
            const hiraganaElement = "";
            const currentHiraganaDisplay = hiraganaElement ? hiraganaElement.textContent || '' : '';
            
            // プレースホルダーテキストを除去
            const cleanCurrentText = currentHiraganaDisplay === 'ここにひらがなで表示されます...' ? '' : currentHiraganaDisplay;
            const newHiraganaText = cleanCurrentText + (cleanCurrentText ? '\n' : '') + hiragana;
            this.uiManager.displayHiragana(newHiraganaText);
        }
        
        // メインタブに切り替え
        this.tabManager.switchTab('main');
        
        console.log('History item output (appended):', { text, hiragana, index, newFinalText });
    }

    handleHistoryDelete(deletedItem, index) {
        console.log('History item deleted:', { deletedItem, index });
        // 必要に応じて追加の処理を実装
    }

    // Gemini API関連ハンドラー
    async handleVerifyApiKey() {
        const apiKeyInput = this.domElements.get('geminiApiKeyInput');
        const apiKeyStatus = this.domElements.get('apiKeyStatus');

        if (!apiKeyInput) {
            console.error('APIキー入力欄が見つかりません');
            return;
        }

        const apiKey = apiKeyInput.value.trim();

        if (!apiKey) {
            if (apiKeyStatus) {
                apiKeyStatus.textContent = 'APIキーを入力してください';
                apiKeyStatus.style.color = 'red';
            }
            return;
        }

        // 検証中の表示
        if (apiKeyStatus) {
            apiKeyStatus.textContent = '検証中...';
            apiKeyStatus.style.color = 'blue';
        }

        // APIキーを検証
        const result = await this.geminiManager.verifyApiKey(apiKey);

        if (apiKeyStatus) {
            if (result.success) {
                apiKeyStatus.textContent = '✓ APIキーは有効です';
                apiKeyStatus.style.color = 'green';
                this.logger.info('WebSpeechApp', 'APIキー検証成功');
            } else {
                apiKeyStatus.textContent = '✗ ' + result.message;
                apiKeyStatus.style.color = 'red';
                this.logger.error('WebSpeechApp', 'APIキー検証失敗', result.message);
            }
        }
    }

    handleGeminiStatus(message, type) {
        // Geminiのステータスをログに記録
        this.logger.info('WebSpeechApp', `Gemini Status [${type}]: ${message}`);

        // 必要に応じてUIに表示
        const apiKeyStatus = this.domElements.get('apiKeyStatus');
        if (apiKeyStatus) {
            apiKeyStatus.textContent = message;

            switch (type) {
                case 'success':
                    apiKeyStatus.style.color = 'green';
                    break;
                case 'error':
                    apiKeyStatus.style.color = 'red';
                    break;
                case 'info':
                default:
                    apiKeyStatus.style.color = 'blue';
                    break;
            }
        }
    }

    handleTokenUpdate(usageMetadata) {
        // トークン使用量をログに記録
        this.logger.info('WebSpeechApp', 'トークン使用量更新', usageMetadata);

        // UIに表示
        const tokenDisplay = this.domElements.get('tokenUsageDisplay');
        if (tokenDisplay && usageMetadata) {
            const promptTokens = usageMetadata.promptTokenCount || 0;
            const candidatesTokens = usageMetadata.candidatesTokenCount || 0;
            const totalTokens = usageMetadata.totalTokenCount || 0;

            tokenDisplay.innerHTML = `
                <strong>トークン使用量:</strong>
                入力: ${promptTokens.toLocaleString()} |
                出力: ${candidatesTokens.toLocaleString()} |
                合計: ${totalTokens.toLocaleString()}
            `;
            tokenDisplay.style.display = 'block';
        }
    }

    handleRateLimitUpdate(rateLimitStats) {
        // レート制限使用状況をログに記録
        this.logger.info('WebSpeechApp', 'レート制限使用状況更新', rateLimitStats);

        // UIに表示
        const rateLimitDisplay = this.domElements.get('rateLimitDisplay');
        if (rateLimitDisplay && rateLimitStats) {
            const { model, requests, tokens } = rateLimitStats;

            // 残り率に応じて色を変更
            const requestColor = requests.percentage > 80 ? 'red' : requests.percentage > 50 ? 'orange' : 'green';
            const tokenColor = tokens.percentage > 80 ? 'red' : tokens.percentage > 50 ? 'orange' : 'green';

            rateLimitDisplay.innerHTML = `
                <strong>レート制限 (${model}):</strong><br>
                <span style="color: ${requestColor};">RPM: ${requests.used}/${requests.limit} (残り: ${requests.remaining})</span> |
                <span style="color: ${tokenColor};">TPM: ${tokens.used.toLocaleString()}/${tokens.limit.toLocaleString()} (残り: ${tokens.remaining.toLocaleString()})</span>
            `;
            rateLimitDisplay.style.display = 'block';
        }
    }

    async handleSummarizeText() {
        const currentText = this.domElements.get('resultTextElement').textContent.trim();

        // プレースホルダーテキストを除外
        const cleanText = currentText === 'ここに認識されたテキストが表示されます...' ? '' : currentText;

        if (!cleanText) {
            alert('要約するテキストがありません');
            return;
        }

        if (!this.geminiManager.hasApiKey()) {
            alert('先にAPIキーを設定・検証してください');
            return;
        }

        // 要約実行
        const result = await this.geminiManager.summarizeText(cleanText);

        if (result.success) {
            // 要約結果を表示
            this.displaySummary(result.summary);
            this.logger.info('WebSpeechApp', 'テキスト要約成功');
        } else {
            // エラーメッセージを整形
            const errorMsg = this.formatGeminiError(result.error);
            alert('要約に失敗しました: ' + errorMsg);
            this.logger.error('WebSpeechApp', '要約失敗', result.error);
        }
    }

    displaySummary(summary) {
        // 要約結果を表示するエリアを取得
        const summaryElement = this.domElements.get('summaryResult');
        const summaryContainer = this.domElements.get('summaryContainer');

        if (!summaryElement || !summaryContainer) {
            // 要約結果表示エリアが存在しない場合は、エラーログを出力
            console.error('要約結果表示エリアが見つかりません');
            // 代替として、アラートで表示
            alert('要約結果:\n\n' + summary);
            return;
        }

        // 要約結果を表示
        summaryElement.textContent = summary;
        summaryContainer.style.display = 'block';

        this.logger.info('WebSpeechApp', '要約結果を表示', { summaryLength: summary.length });
    }

    async handleIdentifySpeakers() {
        const currentText = this.domElements.get('resultTextElement').textContent.trim();

        // プレースホルダーテキストを除外
        const cleanText = currentText === 'ここに認識されたテキストが表示されます...' ? '' : currentText;

        if (!cleanText) {
            alert('識別するテキストがありません');
            return;
        }

        if (!this.geminiManager.hasApiKey()) {
            alert('先にAPIキーを設定・検証してください');
            return;
        }

        // 話者識別実行
        const result = await this.geminiManager.identifySpeakers(cleanText);

        if (result.success) {
            // 結果を表示
            this.displaySpeakerJson(result);
            this.logger.info('WebSpeechApp', '話者識別成功');
        } else {
            // エラーメッセージを整形
            const errorMsg = this.formatGeminiError(result.error);
            alert('話者識別に失敗しました: ' + errorMsg);
            this.logger.error('WebSpeechApp', '話者識別失敗', result.error);
        }
    }

    displaySpeakerJson(result) {
        const speakerJsonElement = this.domElements.get('speakerJsonResult');
        const speakerJsonContainer = this.domElements.get('speakerJsonContainer');

        if (!speakerJsonElement || !speakerJsonContainer) {
            // JSON表示エリアが存在しない場合
            console.error('話者識別結果表示エリアが見つかりません');

            // 代替として、コンソールに出力してアラートで通知
            console.log('Speaker identification result:', result);

            if (result.speakerData) {
                alert('話者識別結果:\n\n' + JSON.stringify(result.speakerData, null, 2));
                // タイムラインに描画（アラート表示の場合も）
                this.renderToTimeline(result.speakerData);
            } else if (result.rawResponse) {
                alert('話者識別結果 (パース失敗):\n\n' + result.rawResponse);
            }
            return;
        }

        // JSON形式で表示
        let displayText = '';

        if (result.speakerData) {
            // パース成功時
            displayText = JSON.stringify(result.speakerData, null, 2);

            // タイムラインに描画
            this.renderToTimeline(result.speakerData);
        } else if (result.rawResponse) {
            // パース失敗時は生データを表示
            displayText = '【JSON解析に失敗しました】\n\n' + result.rawResponse;
        }

        speakerJsonElement.textContent = displayText;
        speakerJsonContainer.style.display = 'block';

        this.logger.info('WebSpeechApp', '話者識別結果を表示', {
            hasValidJson: !!result.speakerData,
            utteranceCount: result.speakerData?.utterances?.length || 0
        });
    }

    // タイムラインに描画
    renderToTimeline(speakerData) {
        if (!speakerData || !speakerData.utterances) {
            this.logger.warn('WebSpeechApp', 'タイムライン描画: 有効なデータがありません');
            return;
        }

        try {
            // window.renderUtterances を使用してタイムラインに描画
            if (typeof window.renderUtterances === 'function') {
                const success = window.renderUtterances(speakerData);
                if (success) {
                    this.logger.info('WebSpeechApp', 'タイムラインに描画成功', {
                        utteranceCount: speakerData.utterances.length
                    });
                } else {
                    this.logger.error('WebSpeechApp', 'タイムライン描画に失敗');
                }
            } else {
                this.logger.error('WebSpeechApp', 'renderUtterances関数が見つかりません');
                console.error('window.renderUtterances is not available');
            }
        } catch (error) {
            this.logger.error('WebSpeechApp', 'タイムライン描画中にエラー', error);
            console.error('Error rendering to timeline:', error);
        }
    }


    handleSpeechRecognitionResult(result) {
        const { finalTranscript, interimTranscript, newFinalPortion } = result;
        
        // 結果をUI上に表示
        this.uiManager.displayResult(finalTranscript, interimTranscript);
        
        // 右側タイムラインにフェーズバッファとして確定分を追記
        if (newFinalPortion && this.timelineManager) {
            this.timelineManager.appendFromRecognition(newFinalPortion);
        }
    }

    handleSpeechRecognitionStateChange(state) {
        switch (state) {
            case 'started':
                this.uiManager.setRecognitionStartState();
                break;
            case 'ended':
                this.uiManager.setRecognitionStopState();
                break;
        }
    }

    // Gemini APIエラーメッセージをフォーマット
    formatGeminiError(error) {
        if (typeof error === 'string') {
            return error;
        }

        if (error && typeof error === 'object') {
            const code = error.code;
            const status = error.status;
            const message = error.message || '';

            // エラーコードに応じた日本語メッセージ
            if (code === 503 || status === 'UNAVAILABLE') {
                return 'APIサーバーが過負荷です。しばらく待ってから再度お試しください。';
            } else if (code === 429 || status === 'RESOURCE_EXHAUSTED') {
                return 'APIのレート制限に達しました。しばらく待ってから再度お試しください。';
            } else if (code === 401 || code === 403) {
                return 'APIキーが無効です。正しいAPIキーを設定してください。';
            } else if (code === 400) {
                return 'リクエストが無効です。入力内容を確認してください。';
            } else if (message) {
                return message;
            }
        }

        return 'APIエラーが発生しました。';
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
            historyStats: this.tabManager?.getHistoryStats() || {}
        };
    }

    // ページリロード時に認識結果を保持（履歴保存なし）
    saveCurrentTextToHistoryOnReload() {
        // ページがunloadされる前に認識結果のみ保存
        window.addEventListener('beforeunload', () => {
            const resultTextElement = this.domElements.get('resultTextElement');
            
            if (resultTextElement) {
                const originalText = resultTextElement.textContent || resultTextElement.innerText || '';
                
                // プレースホルダーテキストは保存しない
                const cleanOriginalText = originalText === 'ここに認識されたテキストが表示されます...' ? '' : originalText;
                const cleanHiraganaText = hiraganaText === 'ここにひらがなで表示されます...' ? '' : hiraganaText;
                
                // 認識結果をLocalStorageに保存（リロード時復元用のみ、履歴保存なし）
                this.saveCurrentTextForReload(cleanOriginalText, cleanHiraganaText);
            }
        });
    }

    // リロード用の現在テキストを保存
    saveCurrentTextForReload(originalText, hiraganaText) {
        try {
            const textData = {
                original: originalText,
                hiragana: hiraganaText,
                timestamp: Date.now()
            };
            localStorage.setItem('webSpeechApp_currentText', JSON.stringify(textData));
            console.log('Current text saved for reload:', textData);
        } catch (error) {
            console.error('Error saving current text for reload:', error);
        }
    }

    // リロード時にテキストを復元
    restoreTextOnReload() {
        try {
            const savedTextData = localStorage.getItem('webSpeechApp_currentText');
            if (savedTextData) {
                const textData = JSON.parse(savedTextData);
                
                // 24時間以内のデータのみ復元
                const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
                if (textData.timestamp > oneDayAgo && textData.original.trim()) {
                    // UIに復元
                    this.uiManager.displayResult(textData.original);

                    // Speech Recognitionの内部状態も復元
                    this.speechRecognition.setFinalTranscript(textData.original);

                    console.log('Text restored on reload:', textData);
                } else {
                    // 古いデータを削除
                    localStorage.removeItem('webSpeechApp_currentText');
                }
            }
        } catch (error) {
            console.error('Error restoring text on reload:', error);
            // エラーが発生した場合はデータを削除
            localStorage.removeItem('webSpeechApp_currentText');
        }
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
        
        // ページリロード時に現在のテキストを履歴に保存
        webSpeechApp.saveCurrentTextToHistoryOnReload();
        
        // リロード時にテキストを復元
        webSpeechApp.restoreTextOnReload();
        
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