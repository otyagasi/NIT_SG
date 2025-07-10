// 音声認識管理クラス
class SpeechRecognitionManager {
    constructor() {
        this.recognition = null;
        this.recognizing = false;
        this.finalTranscript = '';
        this.resumeAfterSpeech = false;
        this.onResultCallback = null;
        this.onStatusCallback = null;
        this.onStateChangeCallback = null;
        
        this.initRecognition();
    }

    initRecognition() {
        if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
            console.error('Web Speech API is not supported in this browser');
            if (this.onStatusCallback) {
                this.onStatusCallback('ステータス: お使いのブラウザは Web Speech API に対応していません。');
            }
            return false;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();

        this.recognition.lang = 'ja-JP';
        this.recognition.interimResults = true;
        this.recognition.continuous = true;

        this.setupEventHandlers();
        return true;
    }

    setupEventHandlers() {
        if (!this.recognition) return;

        this.recognition.onstart = () => {
            this.recognizing = true;
            if (this.onStatusCallback) {
                this.onStatusCallback('ステータス: 音声認識中... マイクに向かって話してください。');
            }
            
            if (!this.resumeAfterSpeech) {
                this.finalTranscript = '';
            }
            this.resumeAfterSpeech = false;
            
            if (this.onStateChangeCallback) {
                this.onStateChangeCallback('started');
            }
            
            console.log('Speech recognition started.');
        };

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let newFinalPortion = '';
            
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcriptPart = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    this.finalTranscript += transcriptPart;
                    newFinalPortion += transcriptPart;
                } else {
                    interimTranscript += transcriptPart;
                }
            }

            if (this.onResultCallback) {
                this.onResultCallback({
                    finalTranscript: this.finalTranscript,
                    interimTranscript: interimTranscript,
                    newFinalPortion: newFinalPortion
                });
            }
        };

        this.recognition.onerror = (event) => {
            let errorMessage = `ステータス: エラーが発生しました - ${event.error}`;
            
            switch (event.error) {
                case 'no-speech':
                    errorMessage = 'ステータス: 音声が検出されませんでした。';
                    break;
                case 'audio-capture':
                    errorMessage = 'ステータス: マイクが見つかりません。';
                    break;
                case 'not-allowed':
                case 'service-not-allowed':
                    errorMessage = 'ステータス: マイクの使用が許可されていません。';
                    break;
            }

            if (this.onStatusCallback) {
                this.onStatusCallback(errorMessage);
            }
            
            console.error('Speech recognition error:', event.error, event.message);
            
            if (this.recognizing) {
                this.stop();
            }
        };

        this.recognition.onend = () => {
            this.recognizing = false;
            if (this.onStatusCallback) {
                this.onStatusCallback('ステータス: 音声認識終了');
            }
            
            if (this.onStateChangeCallback) {
                this.onStateChangeCallback('ended');
            }
            
            console.log('Speech recognition ended.');
        };
    }

    start() {
        if (!this.recognition) {
            console.error('Speech recognition not initialized');
            return false;
        }

        if (this.recognizing) {
            console.warn('Speech recognition is already running');
            return false;
        }

        try {
            this.recognition.start();
            return true;
        } catch (e) {
            console.error('Error starting recognition:', e);
            if (this.onStatusCallback) {
                this.onStatusCallback('ステータス: 認識開始エラー。');
            }
            return false;
        }
    }

    stop() {
        if (!this.recognition) {
            return false;
        }

        if (this.recognizing) {
            this.recognition.stop();
            return true;
        }
        return false;
    }

    // 読み上げ後の再開用
    resumeAfterSpeechSynthesis() {
        this.resumeAfterSpeech = true;
        return this.start();
    }

    // 結果をクリア
    clearResults() {
        this.finalTranscript = '';
    }

    // 状態確認
    isRecognizing() {
        return this.recognizing;
    }

    // コールバック設定
    setOnResultCallback(callback) {
        this.onResultCallback = callback;
    }

    setOnStatusCallback(callback) {
        this.onStatusCallback = callback;
    }

    setOnStateChangeCallback(callback) {
        this.onStateChangeCallback = callback;
    }

    // 対応ブラウザかどうかの確認
    static isSupported() {
        return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    }
}

// グローバルに利用できるようにエクスポート
window.SpeechRecognitionManager = SpeechRecognitionManager;