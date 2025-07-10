// 音声合成管理クラス
class TextToSpeechManager {
    constructor() {
        this.lastSpokenHiragana = '';
        this.lastSpokenOriginal = '';
        this.onSpeechStartCallback = null;
        this.onSpeechEndCallback = null;
        this.defaultSettings = {
            lang: 'ja-JP',
            rate: 1.0,
            pitch: 1.0,
            volume: 1.0
        };
    }

    speakText(text, options = {}) {
        if (!text || !text.trim()) {
            alert('読み上げるテキストがありません。');
            return false;
        }

        const settings = { ...this.defaultSettings, ...options };
        
        // 読み上げ開始コールバック
        if (this.onSpeechStartCallback) {
            this.onSpeechStartCallback();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = settings.lang;
        utterance.rate = settings.rate;
        utterance.pitch = settings.pitch;
        utterance.volume = settings.volume;

        utterance.onstart = () => {
            console.log('Speech synthesis started');
        };

        utterance.onend = () => {
            console.log('Speech synthesis ended');
            if (options.callback) {
                options.callback();
            }
            if (this.onSpeechEndCallback) {
                this.onSpeechEndCallback();
            }
        };

        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event.error);
            if (options.onError) {
                options.onError(event.error);
            }
        };

        speechSynthesis.speak(utterance);
        return true;
    }

    speakAll(originalText, hiraganaText, mode = 'hiragana') {
        const textToSpeak = mode === 'original' ? originalText : hiraganaText;
        
        return this.speakText(textToSpeak, {
            callback: () => {
                this.lastSpokenHiragana = hiraganaText;
                this.lastSpokenOriginal = originalText;
            }
        });
    }

    speakNew(originalText, hiraganaText, mode = 'hiragana') {
        let textToSpeak, lastSpoken, newPart;

        if (mode === 'original') {
            textToSpeak = originalText;
            lastSpoken = this.lastSpokenOriginal;
        } else {
            textToSpeak = hiraganaText;
            lastSpoken = this.lastSpokenHiragana;
        }

        // 新しい部分を抽出
        if (textToSpeak.startsWith(lastSpoken)) {
            newPart = textToSpeak.slice(lastSpoken.length);
        } else {
            newPart = textToSpeak; // 先頭が一致しない場合は全文
        }

        if (!newPart.trim()) {
            alert('新しく追加されたテキストがありません。');
            return false;
        }

        return this.speakText(newPart, {
            callback: () => {
                if (mode === 'original') {
                    this.lastSpokenOriginal = textToSpeak;
                } else {
                    this.lastSpokenHiragana = textToSpeak;
                }
            }
        });
    }

    // 音声合成を停止
    stop() {
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
            console.log('Speech synthesis stopped');
            return true;
        }
        return false;
    }

    // 一時停止
    pause() {
        if (speechSynthesis.speaking && !speechSynthesis.paused) {
            speechSynthesis.pause();
            console.log('Speech synthesis paused');
            return true;
        }
        return false;
    }

    // 再開
    resume() {
        if (speechSynthesis.paused) {
            speechSynthesis.resume();
            console.log('Speech synthesis resumed');
            return true;
        }
        return false;
    }

    // 音声合成の状態確認
    isSpeaking() {
        return speechSynthesis.speaking;
    }

    isPaused() {
        return speechSynthesis.paused;
    }

    // 利用可能な音声の取得
    getAvailableVoices() {
        return speechSynthesis.getVoices();
    }

    // 日本語音声の取得
    getJapaneseVoices() {
        return this.getAvailableVoices().filter(voice => 
            voice.lang.startsWith('ja')
        );
    }

    // 特定の音声を設定
    setVoice(voiceName) {
        const voices = this.getAvailableVoices();
        const voice = voices.find(v => v.name === voiceName);
        if (voice) {
            this.defaultSettings.voice = voice;
            return true;
        }
        return false;
    }

    // 読み上げ設定の更新
    updateSettings(settings) {
        this.defaultSettings = { ...this.defaultSettings, ...settings };
    }

    // 設定のリセット
    resetSettings() {
        this.defaultSettings = {
            lang: 'ja-JP',
            rate: 1.0,
            pitch: 1.0,
            volume: 1.0
        };
    }

    // 履歴のクリア
    clearHistory() {
        this.lastSpokenHiragana = '';
        this.lastSpokenOriginal = '';
    }

    // コールバック設定
    setOnSpeechStartCallback(callback) {
        this.onSpeechStartCallback = callback;
    }

    setOnSpeechEndCallback(callback) {
        this.onSpeechEndCallback = callback;
    }

    // 音声合成の対応確認
    static isSupported() {
        return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
    }
}

// グローバルに利用できるようにエクスポート
window.TextToSpeechManager = TextToSpeechManager;