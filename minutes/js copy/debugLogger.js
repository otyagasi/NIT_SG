// デバッグログシステム
class DebugLogger {
    constructor() {
        this.logLevels = {
            ERROR: 0,
            WARN: 1,
            INFO: 2,
            DEBUG: 3,
            TRACE: 4
        };
        
        this.currentLevel = this.logLevels.INFO;
        this.enableConsoleLog = true;
        this.enableTimestamp = true;
        this.enableStackTrace = false;
        this.logHistory = [];
        this.maxHistorySize = 1000;
        
        // 色付きログの設定
        this.colors = {
            ERROR: '#ff4444',
            WARN: '#ffaa00',
            INFO: '#0088cc',
            DEBUG: '#00cc88',
            TRACE: '#888888'
        };
        
        // ログ出力の初期化
        this.initializeLogger();
    }
    
    initializeLogger() {
        // URLパラメータからデバッグレベルを取得
        const urlParams = new URLSearchParams(window.location.search);
        const debugLevel = urlParams.get('debug');
        
        if (debugLevel) {
            this.setLogLevel(debugLevel.toUpperCase());
        }
        
        // ローカルストレージからの設定読み込み
        const savedLevel = localStorage.getItem('webSpeechApp_debugLevel');
        if (savedLevel) {
            this.setLogLevel(savedLevel);
        }
        
        console.log('%c[DebugLogger] 初期化完了', 'color: #00cc88; font-weight: bold');
        console.log(`%c[DebugLogger] 現在のログレベル: ${this.getLevelName(this.currentLevel)}`, 'color: #0088cc');
    }
    
    setLogLevel(level) {
        if (typeof level === 'string') {
            level = this.logLevels[level.toUpperCase()];
        }
        
        if (level !== undefined && level >= 0 && level <= 4) {
            this.currentLevel = level;
            localStorage.setItem('webSpeechApp_debugLevel', this.getLevelName(level));
            console.log(`%c[DebugLogger] ログレベルを ${this.getLevelName(level)} に設定`, 'color: #0088cc');
        }
    }
    
    getLevelName(level) {
        return Object.keys(this.logLevels).find(key => this.logLevels[key] === level) || 'UNKNOWN';
    }
    
    shouldLog(level) {
        return level <= this.currentLevel;
    }
    
    formatMessage(level, module, message, data) {
        const timestamp = this.enableTimestamp ? new Date().toISOString() : '';
        const levelName = this.getLevelName(level);
        
        let formattedMessage = '';
        if (timestamp) {
            formattedMessage += `[${timestamp}] `;
        }
        formattedMessage += `[${levelName}] [${module}] ${message}`;
        
        return { formattedMessage, levelName, data };
    }
    
    addToHistory(level, module, message, data) {
        const historyEntry = {
            timestamp: new Date().toISOString(),
            level: this.getLevelName(level),
            module,
            message,
            data: data ? JSON.stringify(data) : null
        };
        
        this.logHistory.push(historyEntry);
        
        // 履歴サイズの制限
        if (this.logHistory.length > this.maxHistorySize) {
            this.logHistory.shift();
        }
    }
    
    log(level, module, message, data = null) {
        if (!this.shouldLog(level)) return;
        
        const { formattedMessage, levelName } = this.formatMessage(level, module, message, data);
        
        // 履歴に追加
        this.addToHistory(level, module, message, data);
        
        // コンソール出力
        if (this.enableConsoleLog) {
            const color = this.colors[levelName] || '#000000';
            const style = `color: ${color}; font-weight: ${level <= 1 ? 'bold' : 'normal'}`;
            
            if (data) {
                console.log(`%c${formattedMessage}`, style, data);
            } else {
                console.log(`%c${formattedMessage}`, style);
            }
            
            // エラーレベルの場合はスタックトレースも出力
            if (level === this.logLevels.ERROR && this.enableStackTrace) {
                console.trace();
            }
        }
    }
    
    // 便利メソッド
    error(module, message, data) {
        this.log(this.logLevels.ERROR, module, message, data);
    }
    
    warn(module, message, data) {
        this.log(this.logLevels.WARN, module, message, data);
    }
    
    info(module, message, data) {
        this.log(this.logLevels.INFO, module, message, data);
    }
    
    debug(module, message, data) {
        this.log(this.logLevels.DEBUG, module, message, data);
    }
    
    trace(module, message, data) {
        this.log(this.logLevels.TRACE, module, message, data);
    }
    
    // パフォーマンス測定用
    time(label) {
        const key = `timer_${label}`;
        const startTime = performance.now();
        
        this[key] = startTime;
        this.debug('Performance', `タイマー開始: ${label}`);
    }
    
    timeEnd(label) {
        const key = `timer_${label}`;
        const startTime = this[key];
        
        if (startTime !== undefined) {
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            this.info('Performance', `タイマー終了: ${label} (${duration.toFixed(2)}ms)`);
            delete this[key];
            return duration;
        } else {
            this.warn('Performance', `タイマーが見つかりません: ${label}`);
            return null;
        }
    }
    
    // グループ化されたログ
    group(module, title) {
        if (this.enableConsoleLog) {
            console.group(`%c[${module}] ${title}`, `color: ${this.colors.INFO}`);
        }
    }
    
    groupEnd() {
        if (this.enableConsoleLog) {
            console.groupEnd();
        }
    }
    
    // ログ履歴の取得
    getHistory(filterModule = null, filterLevel = null) {
        let history = [...this.logHistory];
        
        if (filterModule) {
            history = history.filter(entry => entry.module === filterModule);
        }
        
        if (filterLevel) {
            history = history.filter(entry => entry.level === filterLevel);
        }
        
        return history;
    }
    
    // ログ履歴のクリア
    clearHistory() {
        this.logHistory = [];
        this.info('DebugLogger', 'ログ履歴をクリアしました');
    }
    
    // ログ履歴のエクスポート
    exportHistory(format = 'json') {
        switch (format) {
            case 'json':
                return JSON.stringify(this.logHistory, null, 2);
            case 'csv':
                const headers = 'タイムスタンプ,レベル,モジュール,メッセージ,データ\n';
                const rows = this.logHistory.map(entry => 
                    `"${entry.timestamp}","${entry.level}","${entry.module}","${entry.message}","${entry.data || ''}"`
                ).join('\n');
                return headers + rows;
            case 'txt':
                return this.logHistory.map(entry => 
                    `${entry.timestamp} [${entry.level}] [${entry.module}] ${entry.message}${entry.data ? ' ' + entry.data : ''}`
                ).join('\n');
            default:
                return this.exportHistory('json');
        }
    }
    
    // デバッグ情報の表示
    showDebugInfo() {
        this.group('DebugLogger', 'デバッグ情報');
        this.info('DebugLogger', `現在のログレベル: ${this.getLevelName(this.currentLevel)}`);
        this.info('DebugLogger', `ログ履歴件数: ${this.logHistory.length}`);
        this.info('DebugLogger', `コンソール出力: ${this.enableConsoleLog ? '有効' : '無効'}`);
        this.info('DebugLogger', `タイムスタンプ: ${this.enableTimestamp ? '有効' : '無効'}`);
        this.info('DebugLogger', `スタックトレース: ${this.enableStackTrace ? '有効' : '無効'}`);
        this.groupEnd();
    }
    
    // 設定の変更
    configure(options) {
        if (options.logLevel !== undefined) {
            this.setLogLevel(options.logLevel);
        }
        
        if (options.enableConsoleLog !== undefined) {
            this.enableConsoleLog = options.enableConsoleLog;
        }
        
        if (options.enableTimestamp !== undefined) {
            this.enableTimestamp = options.enableTimestamp;
        }
        
        if (options.enableStackTrace !== undefined) {
            this.enableStackTrace = options.enableStackTrace;
        }
        
        if (options.maxHistorySize !== undefined) {
            this.maxHistorySize = options.maxHistorySize;
        }
        
        this.info('DebugLogger', '設定を更新しました', options);
    }
}

// グローバルデバッグロガーのインスタンス
const debugLogger = new DebugLogger();

// ウィンドウオブジェクトに追加（デバッグ用）
window.debugLogger = debugLogger;

// グローバルに利用できるようにエクスポート
window.DebugLogger = DebugLogger;