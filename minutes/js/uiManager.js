// UI管理クラス
class UIManager {
    constructor() {
        this.elements = null;
        this.isProgressVisible = false;
        this.currentProgressPercent = 0;
    }

    // DOM要素を設定
    setElements(elements) {
        this.elements = elements;
    }

    // プログレスバーの表示
    showProgress() {
        const progressContainer = this.elements.get('progressContainer');
        const mainTabContentHeaderText = this.elements.get('mainTabContentHeaderText');

        if (progressContainer && mainTabContentHeaderText) {
            mainTabContentHeaderText.style.display = 'none';
            progressContainer.style.display = 'block';
            this.isProgressVisible = true;
            this.updateProgress(0);
            console.log('Progress bar shown');
        }
    }

    // プログレスバーの非表示
    hideProgress() {
        const progressContainer = this.elements.get('progressContainer');
        const mainTabContentHeaderText = this.elements.get('mainTabContentHeaderText');

        if (progressContainer && mainTabContentHeaderText) {
            progressContainer.style.display = 'none';
            mainTabContentHeaderText.style.display = 'block';
            this.isProgressVisible = false;
            console.log('Progress bar hidden');
        }
    }

    // プログレスバーの更新
    updateProgress(percent) {
        const progressBar = this.elements.get('progressBar');
        const progressText = this.elements.get('progressText');

        if (progressBar && progressText) {
            const validPercent = Math.max(0, Math.min(100, percent));
            progressBar.style.width = validPercent + '%';
            progressText.textContent = Math.round(validPercent) + '%';
            this.currentProgressPercent = validPercent;
        }
    }

    // ステータスメッセージの表示
    showStatus(message, type = 'info') {
        const statusElement = this.elements.get('statusElement');
        
        if (statusElement) {
            statusElement.textContent = message;
            
            // タイプに応じてスタイルを変更（オプション）
            statusElement.className = `status-${type}`;
            
            console.log(`Status (${type}):`, message);
        }
    }

    // kuromoji関連のステータス表示
    showKuromojiStatus(message, type = 'info') {
        const kuromojiStatusElement = this.elements.get('kuromojiStatusElement');
        
        if (kuromojiStatusElement) {
            kuromojiStatusElement.textContent = message;
            
            // タイプに応じてスタイルを変更（オプション）
            kuromojiStatusElement.className = `kuromoji-status-${type}`;
            
            console.log(`Kuromoji Status (${type}):`, message);
        }
    }

    // 結果テキストの表示
    displayResult(finalText, interimText = '') {
        const resultTextElement = this.elements.get('resultTextElement');
        
        if (resultTextElement) {
            let displayText = finalText;
            if (interimText) {
                displayText += '<span class="interim">' + this.escapeHtml(interimText) + '</span>';
            }
            resultTextElement.innerHTML = displayText;
        }
    }

    // ひらがなテキストの表示
    displayHiragana(hiraganaText) {
        const hiraganaTextElement = this.elements.get('hiraganaTextElement');
        
        if (hiraganaTextElement) {
            hiraganaTextElement.textContent = hiraganaText;
        }
    }

    // 結果のクリア
    clearResults() {
        const resultTextElement = this.elements.get('resultTextElement');
        const hiraganaTextElement = this.elements.get('hiraganaTextElement');
        
        if (resultTextElement) {
            resultTextElement.innerHTML = '';
        }
        
        if (hiraganaTextElement) {
            hiraganaTextElement.textContent = '';
        }
    }

    // ボタンの状態制御
    setButtonState(buttonName, enabled) {
        const button = this.elements.get(buttonName);
        
        if (button) {
            button.disabled = !enabled;
            
            // 視覚的なフィードバック
            if (enabled) {
                button.classList.remove('disabled');
            } else {
                button.classList.add('disabled');
            }
        }
    }

    // 複数ボタンの状態制御
    setMultipleButtonStates(buttonStates) {
        Object.entries(buttonStates).forEach(([buttonName, enabled]) => {
            this.setButtonState(buttonName, enabled);
        });
    }

    // 音声認識開始時のUI状態
    setRecognitionStartState() {
        this.setMultipleButtonStates({
            'startButton': false,
            'stopButton': true,
            'clearButton': true,
            'saveHistoryButton': true
        });
        
        this.showStatus('ステータス: 音声認識中... マイクに向かって話してください。', 'active');
    }

    // 音声認識停止時のUI状態
    setRecognitionStopState(kuromojiReady = true) {
        this.setMultipleButtonStates({
            'startButton': kuromojiReady,
            'stopButton': false,
            'clearButton': true,
            'saveHistoryButton': true
        });
        
        this.showStatus('ステータス: 音声認識終了', 'info');
    }

    // kuromoji初期化時のUI状態
    setKuromojiInitializingState() {
        this.setButtonState('startButton', false);
        this.setButtonState('clearButton', true);
        this.showRetryButton(false);
        this.showProgress();
    }

    // kuromoji初期化完了時のUI状態
    setKuromojiReadyState() {
        this.setButtonState('startButton', true);
        this.setButtonState('clearButton', true);
        this.setButtonState('saveHistoryButton', true);
        this.showRetryButton(false);
        this.hideProgress();
    }

    // kuromoji初期化失敗時のUI状態
    setKuromojiErrorState() {
        this.setButtonState('startButton', true);
        this.setButtonState('clearButton', true);
        this.showRetryButton(true);
        this.hideProgress();
    }

    // 再試行ボタンの表示/非表示
    showRetryButton(show) {
        const retryButton = this.elements.get('retryButton');
        
        if (retryButton) {
            retryButton.style.display = show ? 'inline-block' : 'none';
        }
    }
    /*
    読み上げ削除
    // 読み上げモードの取得
    getSpeakMode() {
        const speakModeOriginal = this.elements.get('speakModeOriginal');
        const speakModeHiragana = this.elements.get('speakModeHiragana');
        
        if (speakModeOriginal && speakModeOriginal.checked) {
            return 'original';
        } else if (speakModeHiragana && speakModeHiragana.checked) {
            return 'hiragana';
        }
        
        return 'hiragana'; // デフォルト
    }

    // 読み上げモードの設定
    setSpeakMode(mode) {
        const speakModeOriginal = this.elements.get('speakModeOriginal');
        const speakModeHiragana = this.elements.get('speakModeHiragana');
        
        if (mode === 'original' && speakModeOriginal) {
            speakModeOriginal.checked = true;
            if (speakModeHiragana) speakModeHiragana.checked = false;
        } else if (mode === 'hiragana' && speakModeHiragana) {
            speakModeHiragana.checked = true;
            if (speakModeOriginal) speakModeOriginal.checked = false;
        }
    }
    */

    // エラーメッセージの表示
    showError(message, duration = 5000) {
        this.showStatus(`エラー: ${message}`, 'error');
        
        // 指定時間後に通常のステータスに戻す
        if (duration > 0) {
            setTimeout(() => {
                this.showStatus('ステータス: 待機中', 'info');
            }, duration);
        }
    }

    // 成功メッセージの表示
    showSuccess(message, duration = 3000) {
        this.showStatus(message, 'success');
        
        // 指定時間後に通常のステータスに戻す
        if (duration > 0) {
            setTimeout(() => {
                this.showStatus('ステータス: 待機中', 'info');
            }, duration);
        }
    }

    // 通知の表示（オプション）
    showNotification(message, type = 'info', duration = 3000) {
        // 簡単な通知システム
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            transition: opacity 0.3s ease;
        `;
        
        // タイプに応じた背景色
        const colors = {
            'info': '#007bff',
            'success': '#28a745',
            'warning': '#ffc107',
            'error': '#dc3545'
        };
        
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        // 自動削除
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    // HTMLエスケープ
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 現在のプログレス値を取得
    getCurrentProgress() {
        return this.currentProgressPercent;
    }

    // プログレスバーの表示状態を取得
    isProgressShown() {
        return this.isProgressVisible;
    }
}

// グローバルに利用できるようにエクスポート
window.UIManager = UIManager;