// DOM要素管理
class DOMElements {
    constructor() {
        this.elements = {};
        this.initElements();
    }

    initElements() {
        // 必須要素（これらがないとアプリが動作しない）
        this.requiredElements = [
            'startButton', 'stopButton', 'resultText', 
            'status', 'kuromojiStatus', 'progressContainer', 'progressBar', 'progressText',
            'tab-main', 'tab-history', 'main-tab-content', 'history-tab-content',
            'history-empty', 'history-list', 'mainTabContentHeaderText'
        ];

        // 音声認識制御ボタン
        this.elements.startButton = document.getElementById('startButton');
        this.elements.stopButton = document.getElementById('stopButton');
        this.elements.retryButton = document.getElementById('retryButton');
        this.elements.clearButton = document.getElementById('clearButton');
        this.elements.saveHistoryButton = document.getElementById('saveHistoryButton');
        this.elements.saveTxt = document.getElementById('saveTxt');

        // 結果表示エリア
        this.elements.resultTextElement = document.getElementById('resultText');
        this.elements.hiraganaTextElement = document.getElementById('hiraganaText');

        this.elements.statusElement = document.getElementById('status');
        this.elements.kuromojiStatusElement = document.getElementById('kuromojiStatus');

        // プログレスバー
        this.elements.progressContainer = document.getElementById('progressContainer');
        this.elements.progressBar = document.getElementById('progressBar');
        this.elements.progressText = document.getElementById('progressText');

        // タブ・履歴管理
        this.elements.tabMainBtn = document.getElementById('tab-main');
        this.elements.tabHistoryBtn = document.getElementById('tab-history');
        this.elements.mainTabContent = document.getElementById('main-tab-content');
        this.elements.historyTabContent = document.getElementById('history-tab-content');
        this.elements.historyEmpty = document.getElementById('history-empty');
        this.elements.historyList = document.getElementById('history-list');
        this.elements.historySearch = document.getElementById('history-search');
        this.elements.historyClear = document.getElementById('history-clear');
        this.elements.historyExport = document.getElementById('history-export');
        this.elements.historyStats = document.getElementById('history-stats');
        this.elements.historyImport = document.getElementById('history-import');
        this.elements.historyImportLabel = document.querySelector('.history-import-label');

        // その他のUI要素
        this.elements.mainTabContentHeaderText = document.getElementById('mainTabContentHeaderText');

        // 音声合成関連
        this.elements.speakAllButton = document.getElementById('speakAllButton');
        this.elements.speakNewButton = document.getElementById('speakNewButton');
        this.elements.speakStopButton = document.getElementById('speakStopButton');
        this.elements.voiceSelect = document.getElementById('voiceSelect');
    }

    get(elementName) {
        return this.elements[elementName];
    }

    // 存在チェック
    exists(elementName) {
        return this.elements[elementName] !== null && this.elements[elementName] !== undefined;
    }

    // 全要素の存在チェック
    validateElements() {
        const missingRequired = [];
        const missingOptional = [];
        
        for (const [name, element] of Object.entries(this.elements)) {
            if (!element) {
                const elementId = this.getElementId(name);
                if (this.requiredElements.includes(elementId)) {
                    missingRequired.push(name);
                } else {
                    missingOptional.push(name);
                }
            }
        }
        
        // オプショナル要素の警告
        if (missingOptional.length > 0) {
            console.warn('Missing optional DOM elements (will continue):', missingOptional);
            if (window.debugLogger) {
                window.debugLogger.warn('DOMElements', 'オプショナル要素が見つかりません', { missingOptional });
            }
        }
        
        // 必須要素のエラー
        if (missingRequired.length > 0) {
            console.error('Missing required DOM elements:', missingRequired);
            if (window.debugLogger) {
                window.debugLogger.error('DOMElements', '必須要素が見つかりません', { missingRequired });
            }
            return false;
        }
        
        if (window.debugLogger) {
            window.debugLogger.info('DOMElements', 'DOM要素検証完了', {
                totalElements: Object.keys(this.elements).length,
                foundElements: Object.values(this.elements).filter(el => el).length,
                missingOptional: missingOptional.length
            });
        }
        
        return true;
    }
    
    // 要素名からIDを取得するヘルパーメソッド
    getElementId(elementName) {
        // 要素名からIDへのマッピング
        const nameToIdMap = {
            'startButton': 'startButton',
            'stopButton': 'stopButton',
            'retryButton': 'retryButton',
            'clearButton': 'clearButton',
            'resultTextElement': 'resultText',
            'statusElement': 'status',
            'kuromojiStatusElement': 'kuromojiStatus',
            'progressContainer': 'progressContainer',
            'progressBar': 'progressBar',
            'progressText': 'progressText',
            'speakButton': 'speakButton',
            'speakAllButton': 'speakAllButton',
            'speakNewButton': 'speakNewButton',
            'speakStopButton': 'speakStopButton',
            'speakModeOriginal': 'speakModeOriginal',
            'voiceSelect': 'voiceSelect',
            'tabMainBtn': 'tab-main',
            'tabHistoryBtn': 'tab-history',
            'mainTabContent': 'main-tab-content',
            'historyTabContent': 'history-tab-content',
            'historyEmpty': 'history-empty',
            'historyList': 'history-list',
            'historySearch': 'history-search',
            'historyClear': 'history-clear',
            'historyExport': 'history-export',
            'historyImport': 'history-import',
            'historyImportLabel': 'history-import-label',
            'mainTabContentHeaderText': 'mainTabContentHeaderText'
        };
        
        return nameToIdMap[elementName] || elementName;
    }
}

// グローバルに利用できるようにエクスポート
window.DOMElements = DOMElements;