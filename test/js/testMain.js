// テストバージョン用のメインアプリケーション
class TestWebSpeechApp {
    constructor() {
        this.domElements = null;
        this.speechRecognition = null;
        this.uiManager = null;
        this.logger = window.debugLogger;
        this.isInitialized = false;
        
        this.logger.info('TestWebSpeechApp', 'TestWebSpeechApp初期化開始');
    }

    async init() {
        try {
            this.logger.info('TestWebSpeechApp', 'TestWebSpeechApp初期化開始');
            
            // DOM要素の初期化
            this.logger.debug('TestWebSpeechApp', 'DOM要素初期化開始');
            this.domElements = new DOMElements();
            if (!this.domElements.validateElements()) {
                throw new Error('Required DOM elements are missing');
            }
            this.logger.debug('TestWebSpeechApp', 'DOM要素初期化完了');
            
            // UI管理の初期化
            this.logger.debug('TestWebSpeechApp', 'UI管理初期化開始');
            this.uiManager = new UIManager();
            this.uiManager.setElements(this.domElements);
            this.logger.debug('TestWebSpeechApp', 'UI管理初期化完了');
            
            // 音声認識の初期化
            this.logger.debug('TestWebSpeechApp', '音声認識初期化開始');
            this.speechRecognition = new SpeechRecognitionManager();
            if (!this.speechRecognition.recognition) {
                this.handleSpeechRecognitionNotSupported();
                return;
            }
            this.setupSpeechRecognitionCallbacks();
            this.logger.debug('TestWebSpeechApp', '音声認識初期化完了');
            
            // イベントリスナーの設定
            this.logger.debug('TestWebSpeechApp', 'イベントリスナー設定開始');
            this.setupEventListeners();
            this.logger.debug('TestWebSpeechApp', 'イベントリスナー設定完了');
            
            // テストバージョンではkuromoji無効化
            this.uiManager.showKuromojiStatus('テストバージョン: kuromoji.js機能は無効化されています');
            this.uiManager.setButtonState('startButton', true);
            
            this.isInitialized = true;
            this.logger.info('TestWebSpeechApp', 'TestWebSpeechApp初期化完了');
            
        } catch (error) {
            this.logger.error('TestWebSpeechApp', 'TestWebSpeechApp初期化失敗', error);
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

    setupEventListeners() {
        // 音声認識制御ボタン
        const startButton = this.domElements.get('startButton');
        const stopButton = this.domElements.get('stopButton');
        
        if (startButton) {
            startButton.addEventListener('click', () => this.handleStartRecognition());
        }
        
        if (stopButton) {
            stopButton.addEventListener('click', () => this.handleStopRecognition());
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

    handleSpeechRecognitionResult(result) {
        const { finalTranscript, interimTranscript } = result;
        
        // 結果をUI上に表示
        this.uiManager.displayResult(finalTranscript, interimTranscript);
        
        // テストバージョンではひらがな変換なし
        const hiraganaTextElement = this.domElements.get('hiraganaTextElement');
        if (hiraganaTextElement) {
            this.uiManager.displayHiragana(finalTranscript + ' (テストバージョン - ひらがな変換無効)');
        }
    }

    handleSpeechRecognitionStateChange(state) {
        switch (state) {
            case 'started':
                this.uiManager.setRecognitionStartState();
                break;
            case 'ended':
                this.uiManager.setRecognitionStopState(true);
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
}

// グローバル変数として初期化
let testWebSpeechApp = null;

// ページ読み込み時の初期化
window.addEventListener('load', async () => {
    console.log('Test page loaded, initializing TestWebSpeechApp...');
    
    try {
        testWebSpeechApp = new TestWebSpeechApp();
        await testWebSpeechApp.init();
        
    } catch (error) {
        console.error('Failed to initialize test application:', error);
        alert('テストアプリケーションの初期化に失敗しました。ページを再読み込みしてください。');
    }
});

// デバッグ用にグローバルスコープでアクセス可能にする
window.testWebSpeechApp = testWebSpeechApp;