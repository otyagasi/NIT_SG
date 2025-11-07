// タブ管理・履歴管理クラス
class TabManager {
    constructor() {
        this.currentTab = 'main';
        this.recognitionHistory = [];
        this.elements = null;
        this.onTabSwitchCallback = null;
        this.localStorageKey = 'webSpeechApp_history';
        this.metadataKey = 'webSpeechApp_history_metadata';
        
        // 履歴設定
        this.maxHistoryItems = 500; // 最大保存数を100から500に増加
        this.retentionDays = -1; // 無期限保存（-1で無効化）
        
        // LocalStorageから履歴を読み込み
        this.loadHistoryFromStorage();
        this.cleanupExpiredHistory();
        
        // 履歴アイテムのボタンコールバック
        this.onHistoryOutputCallback = null;
        this.onHistoryTxtCallback = null;
        this.onHistoryDeleteCallback = null;
    }

    // TXTファイルをダウンロード
    downloadTxt(text, index) {
        // 指定された形式でテキストを作成
        let txtContent = '';

        if (text) {
            txtContent += text + '\n';
        }
        
        // ファイル名を生成（日時とインデックスベース）
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 19).replace(/[T:]/g, '-');
        const fileName = `speech-history-${dateStr}-${index + 1}.txt`;
        
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
        
        console.log('TXT file downloaded:', fileName);
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

        // 統計情報を更新
        this.updateHistoryStats();

        if (items.length === 0) {
            historyEmpty.style.display = '';
            historyList.style.display = 'none';
            historyList.innerHTML = '';
        } else {
            historyEmpty.style.display = 'none';
            historyList.style.display = '';
            // 新しいものを上に表示するために配列を逆順にする
            const sortedItems = [...items].reverse();
            const historyHtml = sortedItems.map((item, index) => {
                const date = typeof item.date === 'string' ? item.date : item.date.toLocaleString('ja-JP', { hour12: false });
                const originalIndex = items.length - 1 - index; // 元の配列でのインデックス
                
                return `<div class="history-item" data-index="${originalIndex}">
                    <div class="history-content">
                        <div class="history-text-section">
                            <div class="history-text">${this.escapeHtml(item.text)}</div>
                        </div>
                    </div>
                    <div class="history-meta">
                        <div class="history-date">${date}</div>
                        <div class="history-buttons">
                            <button class="history-output-btn" data-index="${originalIndex}" data-text="${this.escapeHtml(item.text)}" title="音声認識エリアに出力">📝 エリアに出力</button>
                            <button class="history-txt-btn" data-index="${originalIndex}" data-text="${this.escapeHtml(item.text)}" title="TXTファイルとして保存">📄 TXT保存</button>
                            <button class="history-delete-btn" data-index="${originalIndex}">🗑️ 削除</button>
                        </div>
                    </div>
                </div>`;
            }).join('');
            historyList.innerHTML = historyHtml;
            
            // ボタンのイベントリスナーを追加
            this.setupHistoryItemButtons();
        }
    }

    // 統計情報を更新
    updateHistoryStats() {
        const historyStats = this.elements.get('historyStats');
        if (!historyStats) return;

        const stats = this.getHistoryStats();
        
        historyStats.innerHTML = `
            <div class="history-stats-content">
                <div class="history-stats-item">
                    <span class="history-stats-label">保存数:</span>
                    <span class="history-stats-value">${stats.totalItems} / ${stats.maxItems}</span>
                </div>
                <div class="history-stats-item">
                    <span class="history-stats-label">使用容量:</span>
                    <span class="history-stats-value">${stats.storageSizeFormatted}</span>
                </div>
            </div>
        `;
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

        // 履歴の上限を設定
        if (this.recognitionHistory.length > this.maxHistoryItems) {
            this.recognitionHistory.shift();
        }

        // LocalStorageに保存
        this.saveHistoryToStorage();

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
        this.saveHistoryToStorage();
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
            
            // LocalStorageに保存
            this.saveHistoryToStorage();
            
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
                this.saveHistoryToStorage();
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

        // LocalStorageのサイズを計算
        const historyDataSize = this.getStorageSize();
        
        return {
            totalItems,
            maxItems: this.maxHistoryItems,
            retentionDays: this.retentionDays,
            totalCharacters,
            averageLength: Math.round(averageLength * 100) / 100,
            oldestDate,
            newestDate,
            storageSize: historyDataSize,
            storageSizeFormatted: this.formatBytes(historyDataSize)
        };
    }

    // LocalStorageのサイズを取得
    getStorageSize() {
        try {
            const historyData = localStorage.getItem(this.localStorageKey);
            return historyData ? new Blob([historyData]).size : 0;
        } catch (error) {
            return 0;
        }
    }

    // バイトサイズをフォーマット
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
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

    // 履歴アイテムボタンのコールバック設定
    setOnHistoryOutputCallback(callback) {
        this.onHistoryOutputCallback = callback;
    }

    setOnHistoryTxtCallback(callback) {
        this.onHistoryTxtCallback = callback;
    }

    setOnHistoryDeleteCallback(callback) {
        this.onHistoryDeleteCallback = callback;
    }

    // 履歴アイテムボタンのイベントリスナー設定
    setupHistoryItemButtons() {
        const historyList = this.elements.get('historyList');
        if (!historyList) return;

        // 出力ボタンのイベントリスナー
        const outputButtons = historyList.querySelectorAll('.history-output-btn');
        outputButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                const text = e.target.dataset.text;

                if (this.onHistoryOutputCallback) {
                    this.onHistoryOutputCallback(text, index);
                }
            });
        });

        // TXT出力ボタンのイベントリスナー
        const txtButtons = historyList.querySelectorAll('.history-txt-btn');
        txtButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                const text = e.target.dataset.text;

                this.downloadTxt(text, index);
            });
        });

        // 削除ボタンのイベントリスナー
        const deleteButtons = historyList.querySelectorAll('.history-delete-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                
                if (confirm('この履歴項目を削除しますか？')) {
                    const deletedItem = this.removeHistoryItem(index);
                    if (this.onHistoryDeleteCallback && deletedItem) {
                        this.onHistoryDeleteCallback(deletedItem, index);
                    }
                }
            });
        });
    }

    // LocalStorageに履歴を保存
    saveHistoryToStorage() {
        try {
            const historyData = JSON.stringify(this.recognitionHistory);
            localStorage.setItem(this.localStorageKey, historyData);
            
            // メタデータも保存
            const metadata = {
                lastSaved: Date.now(),
                retentionDays: this.retentionDays,
                maxItems: this.maxHistoryItems,
                version: '1.0'
            };
            localStorage.setItem(this.metadataKey, JSON.stringify(metadata));
        } catch (error) {
            console.error('Error saving history to localStorage:', error);
        }
    }

    // LocalStorageから履歴を読み込み
    loadHistoryFromStorage() {
        try {
            const historyData = localStorage.getItem(this.localStorageKey);
            if (historyData) {
                const parsedHistory = JSON.parse(historyData);
                if (Array.isArray(parsedHistory)) {
                    this.recognitionHistory = parsedHistory;
                    console.log('History loaded from localStorage:', this.recognitionHistory.length, 'items');
                }
            }
        } catch (error) {
            console.error('Error loading history from localStorage:', error);
            this.recognitionHistory = [];
        }
    }

    // 期限切れの履歴を削除
    cleanupExpiredHistory() {
        // 保存期間が-1の場合は無期限保存のため何もしない
        if (this.retentionDays === -1) {
            return;
        }
        
        const now = Date.now();
        const cutoffTime = now - (this.retentionDays * 24 * 60 * 60 * 1000);
        
        const originalLength = this.recognitionHistory.length;
        this.recognitionHistory = this.recognitionHistory.filter(item => {
            return item.timestamp > cutoffTime;
        });
        
        const removedCount = originalLength - this.recognitionHistory.length;
        if (removedCount > 0) {
            console.log(`Removed ${removedCount} expired history items`);
            this.saveHistoryToStorage();
        }
    }
}

// グローバルに利用できるようにエクスポート
window.TabManager = TabManager;