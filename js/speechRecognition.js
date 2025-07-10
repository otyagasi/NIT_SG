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
        this.logger = window.debugLogger;
        
        this.logger.info('SpeechRecognition', 'SpeechRecognitionManager初期化開始');
        this.initRecognition();
    }

    initRecognition() {
        this.logger.debug('SpeechRecognition', 'initRecognition開始');
        
        if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
            this.logger.error('SpeechRecognition', 'Web Speech API is not supported in this browser');
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

        this.logger.info('SpeechRecognition', 'Speech Recognition設定完了', {
            lang: this.recognition.lang,
            interimResults: this.recognition.interimResults,
            continuous: this.recognition.continuous
        });

        this.setupEventHandlers();
        return true;
    }

    setupEventHandlers() {
        if (!this.recognition) return;

        this.recognition.onstart = () => {
            this.recognizing = true;
            this.logger.info('SpeechRecognition', '音声認識開始', {
                resumeAfterSpeech: this.resumeAfterSpeech,
                finalTranscriptLength: this.finalTranscript.length
            });
            
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
        };

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let newFinalPortion = '';
            
            this.logger.trace('SpeechRecognition', '音声認識結果受信', {
                resultIndex: event.resultIndex,
                resultsLength: event.results.length
            });
            
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcriptPart = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    this.finalTranscript += transcriptPart;
                    newFinalPortion += transcriptPart;
                    this.logger.debug('SpeechRecognition', '最終結果追加', {
                        transcriptPart,
                        confidence: event.results[i][0].confidence
                    });
                } else {
                    interimTranscript += transcriptPart;
                    this.logger.trace('SpeechRecognition', '暫定結果', { transcriptPart });
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
            
            this.logger.error('SpeechRecognition', '音声認識エラー', {
                error: event.error,
                message: event.message,
                recognizing: this.recognizing
            });
            
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