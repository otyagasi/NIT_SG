// 音声合成管理クラス
class TextToSpeechManager {
    constructor() {
        this.lastSpokenHiragana = '';
        this.lastSpokenOriginal = '';
        this.onSpeechStartCallback = null;
        this.onSpeechEndCallback = null;
        this.availableVoices = [];
        this.selectedVoice = null;
        this.voiceSelectElement = null;
        this.defaultSettings = {
            lang: 'ja-JP',
            rate: 1.0,
            pitch: 1.0,
            volume: 1.0
        };
        this.voiceNicknames = {
            'Microsoft Ayumi - Japanese (Japan)': 'あゆみ',
            'Microsoft Haruka - Japanese (Japan)': 'はるか',
            'Microsoft Ichiro - Japanese (Japan)': 'いちろう',
            'Microsoft Sayaka - Japanese (Japan)': 'さやか',
            'Microsoft Naoki - Japanese (Japan)': 'なおき',
            'Google 日本語': 'Google日本語',
            'Kyoko': 'きょうこ',
            'Otoya': 'おとや',
            'Yuri': 'ユリ'
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
        
        // 選択された音声を設定
        if (this.selectedVoice) {
            utterance.voice = this.selectedVoice;
        }

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

    speakAll(originalText, hiraganaText, mode = 'original') {
        const textToSpeak = originalText;
        
        return this.speakText(textToSpeak, {
            callback: () => {
                this.lastSpokenHiragana = hiraganaText;
                this.lastSpokenOriginal = originalText;
            }
        });
    }

    speakNew(originalText, hiraganaText, mode = 'original') {
        let textToSpeak, lastSpoken, newPart;

        textToSpeak = originalText;
        lastSpoken = this.lastSpokenOriginal;

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
                this.lastSpokenOriginal = textToSpeak;
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

    // 音声リストの初期化
    initializeVoices() {
        if (!TextToSpeechManager.isSupported()) {
            console.warn('Speech synthesis not supported');
            return;
        }
        
        this.updateAvailableVoices();
        
        // 音声リストが変更された際の処理
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = () => {
                this.updateAvailableVoices();
                // 音声選択プルダウンを更新
                if (this.voiceSelectElement) {
                    this.populateVoiceSelect(this.voiceSelectElement);
                }
            };
        }
    }
    
    // 利用可能な音声の更新
    updateAvailableVoices() {
        this.availableVoices = speechSynthesis.getVoices().filter(voice => 
            voice.lang.startsWith('ja')
        );
        console.log('Available Japanese voices:', this.availableVoices.length);
    }
    
    // 音声選択プルダウンの初期化
    initializeVoiceSelect(selectElement) {
        if (!selectElement) return;
        
        this.voiceSelectElement = selectElement;
        
        // 音声リストをプルダウンに追加
        this.populateVoiceSelect(selectElement);
        
        // 選択変更時の処理
        selectElement.addEventListener('change', (e) => {
            const selectedIndex = e.target.selectedIndex;
            if (selectedIndex >= 0 && selectedIndex < this.availableVoices.length) {
                this.selectedVoice = this.availableVoices[selectedIndex];
                console.log('Selected voice:', this.selectedVoice.name);
            }
        });
        
        // 音声リストが既に利用可能でない場合、少し待ってから再試行
        if (this.availableVoices.length === 0) {
            setTimeout(() => {
                this.updateAvailableVoices();
                this.populateVoiceSelect(selectElement);
            }, 100);
        }
    }
    
    // 音声選択プルダウンの内容を更新
    populateVoiceSelect(selectElement) {
        if (!selectElement) return;
        
        selectElement.innerHTML = '';
        
        if (this.availableVoices.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = '音声を読み込み中...';
            selectElement.appendChild(option);
            return;
        }
        
        this.availableVoices.forEach((voice, index) => {
            const option = document.createElement('option');
            option.value = index;
            const nickname = this.voiceNicknames[voice.name] || voice.name;
            option.textContent = `[${nickname}]`;
            selectElement.appendChild(option);
        });
        
        // デフォルト音声を設定
        if (this.availableVoices.length > 0) {
            this.selectedVoice = this.availableVoices[0];
            selectElement.selectedIndex = 0;
        }
        
        console.log('Voice select populated with', this.availableVoices.length, 'voices');
    }

    // 音声合成の対応確認
    static isSupported() {
        return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
    }
}

// グローバルに利用できるようにエクスポート
window.TextToSpeechManager = TextToSpeechManager;