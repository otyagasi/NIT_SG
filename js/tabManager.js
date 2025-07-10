// タブ管理・履歴管理クラス
class TabManager {
    constructor() {
        this.currentTab = 'main';
        this.recognitionHistory = [];
        this.elements = null;
        this.onTabSwitchCallback = null;
    }

    // DOM要素を設定
    setElements(elements) {
        this.elements = elements;
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (!this.elements) return;

        const tabMainBtn = this.elements.get('tabMainBtn');
        const tabHistoryBtn = this.elements.get('tabHistoryBtn');

        if (tabMainBtn) {
            tabMainBtn.addEventListener('click', () => this.switchTab('main'));
        }

        if (tabHistoryBtn) {
            tabHistoryBtn.addEventListener('click', () => this.switchTab('history'));
        }
    }

    switchTab(tab) {
        if (this.currentTab === tab) return;

        const tabMainBtn = this.elements.get('tabMainBtn');
        const tabHistoryBtn = this.elements.get('tabHistoryBtn');
        const mainTabContent = this.elements.get('mainTabContent');
        const historyTabContent = this.elements.get('historyTabContent');

        if (!tabMainBtn || !tabHistoryBtn || !mainTabContent || !historyTabContent) {
            console.error('Required tab elements not found');
            return;
        }

        if (tab === 'main') {
            tabMainBtn.classList.add('active');
            tabHistoryBtn.classList.remove('active');
            mainTabContent.style.display = '';
            historyTabContent.style.display = 'none';
        } else if (tab === 'history') {
            tabMainBtn.classList.remove('active');
            tabHistoryBtn.classList.add('active');
            mainTabContent.style.display = 'none';
            historyTabContent.style.display = '';
            this.renderHistory();
        }

        this.currentTab = tab;

        if (this.onTabSwitchCallback) {
            this.onTabSwitchCallback(tab);
        }

        console.log(`Switched to ${tab} tab`);
    }

    renderHistory(historyItems = null) {
        const historyEmpty = this.elements.get('historyEmpty');
        const historyList = this.elements.get('historyList');

        if (!historyEmpty || !historyList) {
            console.error('History elements not found');
            return;
        }

        const items = historyItems || this.recognitionHistory;

        if (items.length === 0) {
            historyEmpty.style.display = '';
            historyList.style.display = 'none';
            historyList.innerHTML = '';
        } else {
            historyEmpty.style.display = 'none';
            historyList.style.display = '';
            const historyHtml = items.map(item => {
                const date = typeof item.date === 'string' ? item.date : item.date.toLocaleString('ja-JP', { hour12: false });
                return `<div class="history-item">
                    <div class="history-text">${this.escapeHtml(item.text)}</div>
                    <div class="history-date">${date}</div>
                </div>`;
            }).join('');
            historyList.innerHTML = historyHtml;
        }
    }

    // 履歴にテキストを追加
    addToHistory(text) {
        if (!text || !text.trim()) return;

        const historyItem = {
            text: text.trim(),
            date: new Date().toLocaleString('ja-JP', { hour12: false }),
            timestamp: Date.now()
        };

        this.recognitionHistory.push(historyItem);

        // 履歴の上限を設定（例：100件）
        if (this.recognitionHistory.length > 100) {
            this.recognitionHistory.shift();
        }

        // 現在履歴タブが表示されている場合は再描画
        if (this.currentTab === 'history') {
            this.renderHistory();
        }

        console.log('Added to history:', historyItem);
    }

    // 複数のテキストを一度に履歴に追加
    addMultipleToHistory(texts) {
        if (!Array.isArray(texts)) return;

        texts.forEach(text => {
            if (text && text.trim()) {
                this.addToHistory(text);
            }
        });
    }

    // 履歴をクリア
    clearHistory() {
        this.recognitionHistory = [];
        if (this.currentTab === 'history') {
            this.renderHistory();
        }
        console.log('History cleared');
    }

    // 履歴の取得
    getHistory() {
        return [...this.recognitionHistory];
    }

    // 特定の履歴項目を削除
    removeHistoryItem(index) {
        if (index >= 0 && index < this.recognitionHistory.length) {
            const removed = this.recognitionHistory.splice(index, 1);
            if (this.currentTab === 'history') {
                this.renderHistory();
            }
            console.log('Removed history item:', removed[0]);
            return removed[0];
        }
        return null;
    }

    // 履歴の検索
    searchHistory(query) {
        if (!query || !query.trim()) {
            return this.recognitionHistory;
        }

        const searchTerm = query.toLowerCase().trim();
        return this.recognitionHistory.filter(item => 
            item.text.toLowerCase().includes(searchTerm)
        );
    }

    // 履歴のエクスポート
    exportHistory(format = 'json') {
        switch (format) {
            case 'json':
                return JSON.stringify(this.recognitionHistory, null, 2);
            case 'csv':
                const headers = 'テキスト,日時,タイムスタンプ\n';
                const rows = this.recognitionHistory.map(item => 
                    `"${item.text.replace(/"/g, '""')}","${item.date}","${item.timestamp}"`
                ).join('\n');
                return headers + rows;
            case 'txt':
                return this.recognitionHistory.map(item => 
                    `${item.date}: ${item.text}`
                ).join('\n');
            default:
                return this.exportHistory('json');
        }
    }

    // 履歴のインポート
    importHistory(data, format = 'json') {
        try {
            let importedHistory = [];
            
            switch (format) {
                case 'json':
                    importedHistory = JSON.parse(data);
                    break;
                default:
                    throw new Error('Unsupported import format');
            }

            if (Array.isArray(importedHistory)) {
                this.recognitionHistory = importedHistory;
                if (this.currentTab === 'history') {
                    this.renderHistory();
                }
                console.log('History imported successfully');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error importing history:', error);
            return false;
        }
    }

    // 現在のタブを取得
    getCurrentTab() {
        return this.currentTab;
    }

    // 履歴の統計情報
    getHistoryStats() {
        const totalItems = this.recognitionHistory.length;
        const totalCharacters = this.recognitionHistory.reduce((sum, item) => sum + item.text.length, 0);
        const averageLength = totalItems > 0 ? totalCharacters / totalItems : 0;
        
        let oldestDate = null;
        let newestDate = null;
        
        if (totalItems > 0) {
            const timestamps = this.recognitionHistory.map(item => item.timestamp);
            oldestDate = new Date(Math.min(...timestamps));
            newestDate = new Date(Math.max(...timestamps));
        }

        return {
            totalItems,
            totalCharacters,
            averageLength: Math.round(averageLength * 100) / 100,
            oldestDate,
            newestDate
        };
    }

    // HTMLエスケープ
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // コールバック設定
    setOnTabSwitchCallback(callback) {
        this.onTabSwitchCallback = callback;
    }
}

// グローバルに利用できるようにエクスポート
window.TabManager = TabManager;