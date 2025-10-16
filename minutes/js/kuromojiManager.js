// kuromoji.js管理クラス
class KuromojiManager {
    constructor() {
        this.tokenizer = null;
        this.isInitialized = false;
        this.isInitializing = false;
        this.onStatusCallback = null;
        this.onProgressCallback = null;
        this.onInitializedCallback = null;
        this.onErrorCallback = null;
        this.logger = window.debugLogger;
        this.lastHiraganaText = ''; // 最後に変換されたひらがなテキストを保存
        
        this.dicPath = "./dict/";
        this.timeout = 30000; // 30秒タイムアウト
        
        this.logger.info('KuromojiManager', 'KuromojiManager初期化', {
            dicPath: this.dicPath,
            timeout: this.timeout
        });
    }

    async initialize() {
        if (this.isInitialized) {
            this.logger.info('KuromojiManager', 'Kuromoji already initialized');
            return true;
        }

        if (this.isInitializing) {
            this.logger.warn('KuromojiManager', 'Kuromoji initialization already in progress');
            return false;
        }

        this.isInitializing = true;
        this.logger.info('KuromojiManager', 'Kuromoji初期化開始');
        this.logger.time('KuromojiInitialization');
        
        try {
            // 環境情報をログ出力
            this.logEnvironmentInfo();
            
            // CDN接続確認
            if (this.onStatusCallback) {
                this.onStatusCallback('CDN接続を確認中...');
            }
            
            await this.testCDNConnectivity();
            
            if (this.onStatusCallback) {
                this.onStatusCallback('CDN接続確認完了。形態素解析器を初期化中...');
            }
            
            // 500ms待ってから初期化開始
            await new Promise(resolve => setTimeout(resolve, 500));
            
            await this.initializeKuromoji();
            
            this.isInitialized = true;
            this.isInitializing = false;
            
            const duration = this.logger.timeEnd('KuromojiInitialization');
            this.logger.info('KuromojiManager', 'Kuromoji初期化完了', { duration });
            
            if (this.onInitializedCallback) {
                this.onInitializedCallback();
            }
            
            return true;
            
        } catch (error) {
            this.isInitializing = false;
            this.logger.timeEnd('KuromojiInitialization');
            this.logger.error('KuromojiManager', 'Kuromoji初期化失敗', error);
            
            if (this.onErrorCallback) {
                this.onErrorCallback(error);
            }
            
            return false;
        }
    }

    async testCDNConnectivity() {
        const testUrl = 'https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/package.json';
        
        try {
            const response = await fetch(testUrl, { 
                method: 'HEAD',
                cache: 'no-cache',
                mode: 'cors'
            });
            
            if (response.ok) {
                console.log('CDN connectivity test successful');
                return true;
            } else {
                throw new Error(`CDN接続テスト失敗: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error('CDN connectivity test error:', error);
            throw error;
        }
    }

    async initializeKuromoji() {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            if (this.onStatusCallback) {
                this.onStatusCallback('形態素解析器を初期化中... (数秒かかることがあります)');
            }
            
            console.log("Initializing kuromoji.js tokenizer...");
            
            // kuromoji.jsライブラリの存在確認
            if (typeof kuromoji === 'undefined') {
                const error = new Error('kuromoji.jsライブラリが読み込まれていません。CDN接続を確認してください。');
                console.error(error.message);
                reject(error);
                return;
            }
            
            // タイムアウト設定
            const timeout = setTimeout(() => {
                const error = new Error('形態素解析器の初期化がタイムアウトしました。CDN接続またはネットワークの問題が考えられます。');
                console.error(error.message);
                reject(error);
            }, this.timeout);
            
            // 進捗表示用タイマー
            let progressPercent = 0;
            const progressInterval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                
                if (this.onStatusCallback) {
                    this.onStatusCallback(`形態素解析器を初期化中... (${elapsed}秒経過)`);
                }
                
                // 疑似的な進捗更新
                progressPercent = Math.min(progressPercent + Math.random() * 5, 85);
                
                if (this.onProgressCallback) {
                    this.onProgressCallback(progressPercent);
                }
            }, 500);
            
            // 辞書ファイルの存在確認
            this.checkDictionaryFiles();
            
            try {
                kuromoji.builder({ 
                    dicPath: this.dicPath,
                    debug: true,
                    gzip: false
                })
                .build((err, tokenizer) => {
                    clearTimeout(timeout);
                    clearInterval(progressInterval);
                    
                    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
                    
                    if (err) {
                        console.error("Kuromoji initialization error:", err);
                        const error = new Error(`形態素解析器の初期化に失敗しました (${elapsedTime}秒後): ${err.message || 'ネットワークエラーの可能性があります'}`);
                        reject(error);
                        return;
                    }
                    
                    // 成功時は100%まで進捗を更新
                    if (this.onProgressCallback) {
                        this.onProgressCallback(100);
                    }
                    
                    this.tokenizer = tokenizer;
                    
                    if (this.onStatusCallback) {
                        this.onStatusCallback(`形態素解析器の準備ができました (${elapsedTime}秒で完了)`);
                    }
                    
                    console.log(`Kuromoji tokenizer initialized successfully in ${elapsedTime} seconds`);
                    resolve(tokenizer);
                });
                
            } catch (buildError) {
                clearTimeout(timeout);
                clearInterval(progressInterval);
                console.error("Error creating kuromoji builder:", buildError);
                const error = new Error('kuromoji.builderの作成に失敗しました: ' + buildError.message);
                reject(error);
            }
        });
    }

    async checkDictionaryFiles() {
        try {
            console.log("Dictionary path:", this.dicPath);
            console.log("Current URL:", window.location.href);
            
            const response = await fetch(this.dicPath + "base.dat");
            
            if (!response.ok) {
                throw new Error(`辞書ファイルの読み込みに失敗: ${response.status} ${response.statusText}`);
            }
            
            const buffer = await response.arrayBuffer();
            console.log("辞書ファイルの読み込みに成功しました");
            console.log("辞書ファイルのサイズ:", buffer.byteLength);
            
        } catch (error) {
            console.error("辞書ファイルの読み込みエラー:", error);
            if (this.onStatusCallback) {
                this.onStatusCallback(`辞書ファイルの読み込みに失敗しました: ${error.message} (音声認識は利用可能です)`);
            }
        }
    }

    katakanaToHiragana(katakana) {
        return katakana.replace(/[\u30A1-\u30F6]/g, function(match) {
            const chr = match.charCodeAt(0) - 0x60;
            return String.fromCharCode(chr);
        });
    }

    convertToHiragana(text) {
        if (!this.tokenizer || !text.trim()) {
            return text;
        }
        
        try {
            const tokens = this.tokenizer.tokenize(text);
            let hiragana = '';
            
            tokens.forEach(token => {
                if (token.reading && token.reading !== '*') {
                    hiragana += this.katakanaToHiragana(token.reading);
                } else {
                    hiragana += this.katakanaToHiragana(token.surface_form);
                }
            });
            
            // 変換結果を保存
            this.lastHiraganaText = hiragana;
            
            return hiragana;
        } catch (error) {
            console.error("Error during hiragana conversion:", error);
            return text + " (ひらがな変換エラー)";
        }
    }

    logEnvironmentInfo() {
        const info = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            languages: navigator.languages,
            location: window.location.href,
            protocol: window.location.protocol,
            isSecureContext: window.isSecureContext,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            timestamp: new Date().toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
        
        console.log('=== 環境情報 ===');
        console.table(info);
        console.log('=== kuromoji.js 確認 ===');
        console.log('kuromoji available:', typeof kuromoji !== 'undefined');
        console.log('kuromoji version:', typeof kuromoji !== 'undefined' && kuromoji.version ? kuromoji.version : 'unknown');
    }

    // 再初期化
    async reinitialize() {
        this.tokenizer = null;
        this.isInitialized = false;
        this.isInitializing = false;
        
        return await this.initialize();
    }

    // 状態確認
    isReady() {
        return this.isInitialized && this.tokenizer !== null;
    }

    // コールバック設定
    setOnStatusCallback(callback) {
        this.onStatusCallback = callback;
    }

    setOnProgressCallback(callback) {
        this.onProgressCallback = callback;
    }

    setOnInitializedCallback(callback) {
        this.onInitializedCallback = callback;
    }

    setOnErrorCallback(callback) {
        this.onErrorCallback = callback;
    }

    // 最後のひらがなテキストを取得
    getLastHiraganaText() {
        return this.lastHiraganaText;
    }

    // ひらがなテキストを設定
    setLastHiraganaText(text) {
        this.lastHiraganaText = text;
    }
}

// グローバルに利用できるようにエクスポート
window.KuromojiManager = KuromojiManager;