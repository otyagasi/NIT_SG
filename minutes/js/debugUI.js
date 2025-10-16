// デバッグUI管理クラス
class DebugUI {
    constructor() {
        this.logger = window.debugLogger;
        this.isVisible = false;
        this.debugPanel = null;
        this.refreshInterval = null;
        this.refreshRate = 1000; // 1秒間隔
        
        this.initializeDebugUI();
        this.setupKeyboardShortcuts();
    }
    
    initializeDebugUI() {
        // デバッグパネルの作成
        this.createDebugPanel();
        
        // URLパラメータでデバッグUIの表示を制御
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('debugUI') === 'true') {
            this.show();
        }
        
        this.logger.debug('DebugUI', 'デバッグUI初期化完了');
    }
    
    createDebugPanel() {
        // デバッグパネルのHTML構造を作成
        this.debugPanel = document.createElement('div');
        this.debugPanel.id = 'debug-panel';
        this.debugPanel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 400px;
            max-height: 80vh;
            background: rgba(0, 0, 0, 0.9);
            color: #ffffff;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            border: 1px solid #333;
            border-radius: 5px;
            padding: 10px;
            z-index: 10000;
            display: none;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        `;
        
        this.debugPanel.innerHTML = `
            <div id="debug-header" style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
                padding-bottom: 5px;
                border-bottom: 1px solid #333;
            ">
                <h3 style="margin: 0; color: #00ff00;">WebSpeech Debug Panel</h3>
                <button id="debug-close" style="
                    background: #ff4444;
                    color: white;
                    border: none;
                    border-radius: 3px;
                    padding: 2px 8px;
                    cursor: pointer;
                ">×</button>
            </div>
            
            <div id="debug-controls" style="margin-bottom: 10px;">
                <label style="color: #cccccc;">ログレベル:</label>
                <select id="debug-level" style="
                    background: #333;
                    color: white;
                    border: 1px solid #555;
                    margin-left: 5px;
                    padding: 2px;
                ">
                    <option value="0">ERROR</option>
                    <option value="1">WARN</option>
                    <option value="2" selected>INFO</option>
                    <option value="3">DEBUG</option>
                    <option value="4">TRACE</option>
                </select>
                
                <button id="debug-clear" style="
                    background: #555;
                    color: white;
                    border: none;
                    border-radius: 3px;
                    padding: 2px 8px;
                    margin-left: 10px;
                    cursor: pointer;
                ">履歴クリア</button>
                
                <button id="debug-export" style="
                    background: #0088cc;
                    color: white;
                    border: none;
                    border-radius: 3px;
                    padding: 2px 8px;
                    margin-left: 5px;
                    cursor: pointer;
                ">エクスポート</button>
            </div>
            
            <div id="debug-stats" style="
                background: #222;
                padding: 5px;
                border-radius: 3px;
                margin-bottom: 10px;
                font-size: 11px;
            ">
                <div id="debug-app-status">アプリ状態: 初期化中...</div>
                <div id="debug-log-count">ログ件数: 0</div>
                <div id="debug-performance">メモリ使用量: ---</div>
            </div>
            
            <div id="debug-log-container" style="
                max-height: 300px;
                overflow-y: auto;
                background: #111;
                padding: 5px;
                border-radius: 3px;
                border: 1px solid #333;
            ">
                <div id="debug-logs"></div>
            </div>
            
            <div id="debug-commands" style="
                margin-top: 10px;
                font-size: 11px;
                color: #888;
            ">
                <div>ショートカット: Ctrl+D でパネル切り替え</div>
                <div>コンソールコマンド: debugLogger.showDebugInfo()</div>
            </div>
        `;
        
        document.body.appendChild(this.debugPanel);
        this.setupDebugPanelEvents();
    }
    
    setupDebugPanelEvents() {
        // 閉じるボタン
        const closeBtn = document.getElementById('debug-close');
        closeBtn.addEventListener('click', () => this.hide());
        
        // ログレベル変更
        const levelSelect = document.getElementById('debug-level');
        levelSelect.addEventListener('change', (e) => {
            this.logger.setLogLevel(parseInt(e.target.value));
        });
        
        // 履歴クリア
        const clearBtn = document.getElementById('debug-clear');
        clearBtn.addEventListener('click', () => {
            this.logger.clearHistory();
            this.updateLogDisplay();
        });
        
        // エクスポート
        const exportBtn = document.getElementById('debug-export');
        exportBtn.addEventListener('click', () => this.exportLogs());
        
        // ドラッグ可能にする
        this.makeDebugPanelDraggable();
    }
    
    makeDebugPanelDraggable() {
        const header = document.getElementById('debug-header');
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;
        
        header.addEventListener('mousedown', (e) => {
            if (e.target.id !== 'debug-close') {
                initialX = e.clientX - xOffset;
                initialY = e.clientY - yOffset;
                isDragging = true;
                header.style.cursor = 'grabbing';
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                xOffset = currentX;
                yOffset = currentY;
                
                this.debugPanel.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
            header.style.cursor = 'grab';
        });
        
        header.style.cursor = 'grab';
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+D でデバッグパネルの表示/非表示を切り替え
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                this.toggle();
            }
            
            // Ctrl+Shift+D でデバッグ情報を表示
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                this.logger.showDebugInfo();
            }
        });
    }
    
    show() {
        this.debugPanel.style.display = 'block';
        this.isVisible = true;
        this.startAutoRefresh();
        this.logger.debug('DebugUI', 'デバッグパネル表示');
    }
    
    hide() {
        this.debugPanel.style.display = 'none';
        this.isVisible = false;
        this.stopAutoRefresh();
        this.logger.debug('DebugUI', 'デバッグパネル非表示');
    }
    
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    startAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        this.refreshInterval = setInterval(() => {
            this.updateStats();
            this.updateLogDisplay();
        }, this.refreshRate);
    }
    
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
    
    updateStats() {
        // アプリケーション状態の更新
        const appStatusEl = document.getElementById('debug-app-status');
        const logCountEl = document.getElementById('debug-log-count');
        const performanceEl = document.getElementById('debug-performance');
        
        if (window.webSpeechApp) {
            const appState = window.webSpeechApp.getAppState();
            appStatusEl.innerHTML = `
                アプリ状態: ${appState.isInitialized ? '初期化済み' : '初期化中'} | 
                認識中: ${appState.isRecognizing ? 'YES' : 'NO'} | 
                Kuromoji: ${appState.isKuromojiReady ? 'Ready' : 'Not Ready'}
            `;
        }
        
        // ログ件数の更新
        const logHistory = this.logger.getHistory();
        logCountEl.textContent = `ログ件数: ${logHistory.length}`;
        
        // パフォーマンス情報の更新
        if (performance.memory) {
            const memoryInfo = performance.memory;
            const usedMB = Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024);
            const totalMB = Math.round(memoryInfo.totalJSHeapSize / 1024 / 1024);
            performanceEl.textContent = `メモリ使用量: ${usedMB}MB / ${totalMB}MB`;
        } else {
            performanceEl.textContent = 'メモリ使用量: N/A';
        }
    }
    
    updateLogDisplay() {
        const logsContainer = document.getElementById('debug-logs');
        const logHistory = this.logger.getHistory();
        
        // 最新の20件のログを表示
        const recentLogs = logHistory.slice(-20);
        
        logsContainer.innerHTML = recentLogs.map(log => {
            const color = this.getLogLevelColor(log.level);
            const time = new Date(log.timestamp).toLocaleTimeString('ja-JP');
            return `
                <div style="
                    margin-bottom: 2px;
                    padding: 2px;
                    border-left: 3px solid ${color};
                    padding-left: 5px;
                ">
                    <span style="color: #888;">${time}</span>
                    <span style="color: ${color};">[${log.level}]</span>
                    <span style="color: #ccc;">[${log.module}]</span>
                    ${log.message}
                    ${log.data ? `<pre style="margin: 2px 0; font-size: 10px; color: #aaa;">${log.data}</pre>` : ''}
                </div>
            `;
        }).join('');
        
        // 自動スクロール
        logsContainer.scrollTop = logsContainer.scrollHeight;
    }
    
    getLogLevelColor(level) {
        const colors = {
            'ERROR': '#ff4444',
            'WARN': '#ffaa00',
            'INFO': '#0088cc',
            'DEBUG': '#00cc88',
            'TRACE': '#888888'
        };
        return colors[level] || '#ffffff';
    }
    
    exportLogs() {
        const format = 'json'; // 将来的に選択可能にする
        const logData = this.logger.exportHistory(format);
        
        // ダウンロード用のBlobを作成
        const blob = new Blob([logData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // ダウンロードリンクを作成
        const a = document.createElement('a');
        a.href = url;
        a.download = `webspeech-debug-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.logger.info('DebugUI', 'デバッグログをエクスポートしました', { format });
    }
    
    // 外部からのログ追加時に呼び出される
    onLogAdded() {
        if (this.isVisible) {
            this.updateLogDisplay();
        }
    }
}

// デバッグUIの初期化
window.addEventListener('load', () => {
    window.debugUI = new DebugUI();
    
    // ログ追加時のコールバックを設定
    const originalLog = window.debugLogger.log;
    window.debugLogger.log = function(...args) {
        originalLog.apply(this, args);
        if (window.debugUI) {
            window.debugUI.onLogAdded();
        }
    };
});

// グローバルに利用できるようにエクスポート
window.DebugUI = DebugUI;