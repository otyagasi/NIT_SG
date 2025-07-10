// vibeloggerを使用したデバッグログシステム
// Node.jsのvibeloggerライブラリをブラウザで使用するためのラッパークラス

class VibeLogger {
    constructor() {
        this.logs = [];
        this.projectName = 'WebSpeechApp';
        this.isDebugMode = this.checkDebugMode();
        this.correlationId = this.generateCorrelationId();
        
        // ログレベル定義
        this.logLevels = {
            ERROR: 0,
            WARN: 1,
            INFO: 2,
            DEBUG: 3,
            TRACE: 4
        };
        
        this.currentLevel = this.logLevels.INFO;
        
        console.log(`%c[VibeLogger] 初期化完了 - プロジェクト: ${this.projectName}`, 'color: #00cc88; font-weight: bold');
        console.log(`%c[VibeLogger] デバッグモード: ${this.isDebugMode ? '有効' : '無効'}`, 'color: #0088cc');
        console.log(`%c[VibeLogger] 相関ID: ${this.correlationId}`, 'color: #0088cc');
    }
    
    checkDebugMode() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('debug') === 'true' || 
               localStorage.getItem('vibelogger_debug') === 'true' ||
               window.location.hostname === 'localhost' ||
               window.location.hostname === '127.0.0.1';
    }
    
    generateCorrelationId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    createLogEntry(level, operationName, message, context = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level: this.getLevelName(level),
            correlationId: this.correlationId,
            operationName,
            message,
            context: {
                ...context,
                userAgent: navigator.userAgent,
                url: window.location.href,
                stack: new Error().stack
            },
            projectName: this.projectName,
            sessionId: sessionStorage.getItem('sessionId') || 'unknown',
            humanNote: context.humanNote || null,
            aiTodo: context.aiTodo || null
        };
        
        return logEntry;
    }
    
    getLevelName(level) {
        return Object.keys(this.logLevels).find(key => this.logLevels[key] === level) || 'UNKNOWN';
    }
    
    shouldLog(level) {
        return level <= this.currentLevel;
    }
    
    logToConsole(logEntry) {
        const colors = {
            ERROR: '#ff4444',
            WARN: '#ffaa00',
            INFO: '#0088cc',
            DEBUG: '#00cc88',
            TRACE: '#888888'
        };
        
        const color = colors[logEntry.level] || '#000000';
        const style = `color: ${color}; font-weight: ${logEntry.level === 'ERROR' ? 'bold' : 'normal'}`;
        
        console.log(`%c[${logEntry.level}] [${logEntry.operationName}] ${logEntry.message}`, style);
        
        if (this.isDebugMode) {
            console.log('詳細情報:', logEntry);
        }
    }
    
    async saveToFile(logEntry) {
        try {
            // ブラウザ環境ではファイルに直接書き込めないため、ローカルストレージに保存
            const storageKey = `vibelogger_${this.projectName}_${new Date().toISOString().split('T')[0]}`;
            let storedLogs = JSON.parse(localStorage.getItem(storageKey) || '[]');
            
            storedLogs.push(logEntry);
            
            // ログが多すぎる場合は古いものを削除
            if (storedLogs.length > 1000) {
                storedLogs = storedLogs.slice(-1000);
            }
            
            localStorage.setItem(storageKey, JSON.stringify(storedLogs));
            
            // オプション: IndexedDBを使用してより大きなログを保存
            if (this.isDebugMode) {
                await this.saveToIndexedDB(logEntry);
            }
            
        } catch (error) {
            console.error('ログファイル保存エラー:', error);
        }
    }
    
    async saveToIndexedDB(logEntry) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('VibeLogger', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction(['logs'], 'readwrite');
                const store = transaction.objectStore('logs');
                
                store.add(logEntry);
                transaction.oncomplete = () => resolve();
                transaction.onerror = () => reject(transaction.error);
            };
            
            request.onupgradeneeded = () => {
                const db = request.result;
                const store = db.createObjectStore('logs', { keyPath: 'id', autoIncrement: true });
                store.createIndex('timestamp', 'timestamp', { unique: false });
                store.createIndex('correlationId', 'correlationId', { unique: false });
                store.createIndex('operationName', 'operationName', { unique: false });
            };
        });
    }
    
    async log(level, operationName, message, context = {}) {
        if (!this.shouldLog(level)) return;
        
        const logEntry = this.createLogEntry(level, operationName, message, context);
        this.logs.push(logEntry);
        
        // コンソール出力
        this.logToConsole(logEntry);
        
        // ファイル保存
        await this.saveToFile(logEntry);
    }
    
    // 便利メソッド
    async error(operationName, message, context = {}) {
        await this.log(this.logLevels.ERROR, operationName, message, context);
    }
    
    async warn(operationName, message, context = {}) {
        await this.log(this.logLevels.WARN, operationName, message, context);
    }
    
    async info(operationName, message, context = {}) {
        await this.log(this.logLevels.INFO, operationName, message, context);
    }
    
    async debug(operationName, message, context = {}) {
        await this.log(this.logLevels.DEBUG, operationName, message, context);
    }
    
    async trace(operationName, message, context = {}) {
        await this.log(this.logLevels.TRACE, operationName, message, context);
    }
    
    // 例外ログ
    async logException(operationName, error, context = {}) {
        const errorContext = {
            ...context,
            errorName: error.name,
            errorMessage: error.message,
            errorStack: error.stack,
            humanNote: context.humanNote || 'エラーが発生しました。原因を調査してください。',
            aiTodo: context.aiTodo || 'エラーハンドリングの改善を検討してください。'
        };
        
        await this.error(operationName, `例外発生: ${error.message}`, errorContext);
    }
    
    // パフォーマンス測定
    async time(operationName, startMessage = '処理開始') {
        const startTime = performance.now();
        const timerKey = `timer_${operationName}_${startTime}`;
        
        this[timerKey] = startTime;
        
        await this.debug(operationName, startMessage, {
            performanceStart: startTime,
            humanNote: `${operationName}の実行時間を測定中`
        });
        
        return timerKey;
    }
    
    async timeEnd(timerKey, operationName, endMessage = '処理完了') {
        const startTime = this[timerKey];
        
        if (startTime !== undefined) {
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            await this.info(operationName, `${endMessage} (実行時間: ${duration.toFixed(2)}ms)`, {
                performanceEnd: endTime,
                performanceDuration: duration,
                humanNote: `${operationName}の実行時間: ${duration.toFixed(2)}ms`
            });
            
            delete this[timerKey];
            return duration;
        } else {
            await this.warn(operationName, `タイマーが見つかりません: ${timerKey}`);
            return null;
        }
    }
    
    // AI用のログ取得
    getLogsForAI(operationName = null, lastNLogs = 100) {
        let filteredLogs = this.logs;
        
        if (operationName) {
            filteredLogs = filteredLogs.filter(log => log.operationName === operationName);
        }
        
        // 最新のN件を取得
        const recentLogs = filteredLogs.slice(-lastNLogs);
        
        return {
            projectName: this.projectName,
            correlationId: this.correlationId,
            totalLogs: filteredLogs.length,
            returnedLogs: recentLogs.length,
            logs: recentLogs,
            summary: this.generateLogSummary(recentLogs),
            aiInstructions: this.generateAIInstructions(recentLogs)
        };
    }
    
    generateLogSummary(logs) {
        const summary = {
            errorCount: logs.filter(log => log.level === 'ERROR').length,
            warnCount: logs.filter(log => log.level === 'WARN').length,
            infoCount: logs.filter(log => log.level === 'INFO').length,
            debugCount: logs.filter(log => log.level === 'DEBUG').length,
            operations: [...new Set(logs.map(log => log.operationName))],
            timeRange: {
                start: logs.length > 0 ? logs[0].timestamp : null,
                end: logs.length > 0 ? logs[logs.length - 1].timestamp : null
            }
        };
        
        return summary;
    }
    
    generateAIInstructions(logs) {
        const instructions = [];
        
        // humanNoteとaiTodoを収集
        logs.forEach(log => {
            if (log.humanNote) {
                instructions.push(`人間からの注釈: ${log.humanNote} (操作: ${log.operationName})`);
            }
            if (log.aiTodo) {
                instructions.push(`AI TODO: ${log.aiTodo} (操作: ${log.operationName})`);
            }
        });
        
        return instructions;
    }
    
    // ログの出力と保存
    async exportLogs(format = 'json') {
        const logsData = this.getLogsForAI();
        
        let output;
        switch (format) {
            case 'json':
                output = JSON.stringify(logsData, null, 2);
                break;
            case 'csv':
                output = this.convertToCSV(logsData.logs);
                break;
            case 'txt':
                output = this.convertToText(logsData.logs);
                break;
            default:
                output = JSON.stringify(logsData, null, 2);
        }
        
        // ブラウザでファイルダウンロード
        const blob = new Blob([output], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vibelogger_${this.projectName}_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        await this.info('VibeLogger', `ログをエクスポートしました: ${format}形式`);
    }
    
    convertToCSV(logs) {
        const headers = 'タイムスタンプ,レベル,操作名,メッセージ,相関ID,人間の注釈,AI TODO\n';
        const rows = logs.map(log => 
            `"${log.timestamp}","${log.level}","${log.operationName}","${log.message}","${log.correlationId}","${log.humanNote || ''}","${log.aiTodo || ''}"`
        ).join('\n');
        return headers + rows;
    }
    
    convertToText(logs) {
        return logs.map(log => 
            `${log.timestamp} [${log.level}] [${log.operationName}] ${log.message}${log.humanNote ? ' (注釈: ' + log.humanNote + ')' : ''}${log.aiTodo ? ' (AI TODO: ' + log.aiTodo + ')' : ''}`
        ).join('\n');
    }
    
    // 設定
    setLogLevel(level) {
        if (typeof level === 'string') {
            level = this.logLevels[level.toUpperCase()];
        }
        
        if (level !== undefined && level >= 0 && level <= 4) {
            this.currentLevel = level;
            localStorage.setItem('vibelogger_level', this.getLevelName(level));
        }
    }
    
    // デバッグ情報の表示
    async showDebugInfo() {
        const info = {
            projectName: this.projectName,
            correlationId: this.correlationId,
            currentLevel: this.getLevelName(this.currentLevel),
            isDebugMode: this.isDebugMode,
            totalLogs: this.logs.length,
            url: window.location.href,
            userAgent: navigator.userAgent
        };
        
        await this.info('VibeLogger', 'デバッグ情報を表示', {
            debugInfo: info,
            humanNote: 'VibeLoggerの現在の状態を確認してください'
        });
        
        console.table(info);
    }
}

// グローバルインスタンス
const vibeLogger = new VibeLogger();

// ウィンドウオブジェクトに追加
window.vibeLogger = vibeLogger;
window.VibeLogger = VibeLogger;

// デバッグコマンドの追加
if (vibeLogger.isDebugMode) {
    window.vibeLoggerDebug = {
        showInfo: () => vibeLogger.showDebugInfo(),
        exportLogs: (format) => vibeLogger.exportLogs(format),
        setLevel: (level) => vibeLogger.setLogLevel(level),
        getLogsForAI: (operation, count) => vibeLogger.getLogsForAI(operation, count)
    };
    
    console.log('%c[VibeLogger] デバッグコマンドが利用可能です:', 'color: #00cc88; font-weight: bold');
    console.log('- window.vibeLoggerDebug.showInfo() - デバッグ情報表示');
    console.log('- window.vibeLoggerDebug.exportLogs("json") - ログエクスポート');
    console.log('- window.vibeLoggerDebug.setLevel("DEBUG") - ログレベル設定');
    console.log('- window.vibeLoggerDebug.getLogsForAI() - AI用ログ取得');
}