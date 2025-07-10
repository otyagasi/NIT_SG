const startButton = document.getElementById('startButton');
        const stopButton = document.getElementById('stopButton');
        const retryButton = document.getElementById('retryButton');
        const resultTextElement = document.getElementById('resultText');
        const hiraganaTextElement = document.getElementById('hiraganaText');
        const statusElement = document.getElementById('status');
        const kuromojiStatusElement = document.getElementById('kuromojiStatus');
        const progressContainer = document.getElementById('progressContainer');
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        const speakButton = document.getElementById('speakButton');
        const speakAllButton = document.getElementById('speakAllButton');
        const speakNewButton = document.getElementById('speakNewButton');
        const speakModeOriginal = document.getElementById('speakModeOriginal');
        const speakModeHiragana = document.getElementById('speakModeHiragana');
        const mainTabContentHeadertText = document.getElementById('mainTabContentHeadertText');
        const clearButton = document.getElementById('clearButton');
        // 音声認識関連
        let recognition;
        let recognizing = false;
        let finalTranscript = '';
        let kuromojiTokenizer = null;
        let resumeAfterSpeech = false;
        let lastSpokenHiragana = ''; // 前回読み上げたひらがな
        let lastSpokenOriginal = ''; // 前回読み上げたオリジナルテキスト

        // === タブ切替・履歴管理 ===
        const tabMainBtn = document.getElementById('tab-main');
        const tabHistoryBtn = document.getElementById('tab-history');
        const mainTabContent = document.getElementById('main-tab-content');
        const historyTabContent = document.getElementById('history-tab-content');
        const historyEmpty = document.getElementById('history-empty');
        const historyList = document.getElementById('history-list');

        let recognitionHistory = [];

        function switchTab(tab) {
            if (tab === 'main') {
                tabMainBtn.classList.add('active');
                tabHistoryBtn.classList.remove('active');
                mainTabContent.style.display = '';
                historyTabContent.style.display = 'none';
            } else {
                tabMainBtn.classList.remove('active');
                tabHistoryBtn.classList.add('active');
                mainTabContent.style.display = 'none';
                historyTabContent.style.display = '';
                renderHistory();
            }
        }

        tabMainBtn.addEventListener('click', () => switchTab('main'));
        tabHistoryBtn.addEventListener('click', () => switchTab('history'));

        function renderHistory() {
            if (recognitionHistory.length === 0) {
                historyEmpty.style.display = '';
                historyList.style.display = 'none';
                historyList.innerHTML = '';
            } else {
                historyEmpty.style.display = 'none';
                historyList.style.display = '';
                historyList.innerHTML = recognitionHistory.map(item =>
                    `<div class="history-item">
                        <div>${item.text}</div>
                        <div class="history-date">${item.date}</div>
                    </div>`
                ).join('');
            }
        }

        // プログレスバー更新関数
        function updateProgress(percent) {
            progressBar.style.width = percent + '%';
            progressText.textContent = Math.round(percent) + '%';
        }
        
        // プログレスバー表示/非表示制御
        function showProgress() {
            mainTabContentHeadertText.style.display = 'none';
            progressContainer.style.display = 'block';
            updateProgress(0);
        }
        
        function hideProgress() {
            progressContainer.style.display = 'none';
            mainTabContentHeadertText.style.display = 'block';
        }

        // --- kuromoji.js と ひらがな変換関連 ---
        function initializeKuromoji() {
            const startTime = Date.now();
            kuromojiStatusElement.textContent = '形態素解析器を初期化中... (数秒かかることがあります)';
            console.log("Initializing kuromoji.js tokenizer...");
            
            // プログレスバーを表示
            showProgress();
            
            // CDN接続チェック
            console.log("Checking kuromoji.js library availability...");
            if (typeof kuromoji === 'undefined') {
                console.error("kuromoji.js library is not loaded!");
                kuromojiStatusElement.textContent = 'kuromoji.jsライブラリが読み込まれていません。CDN接続を確認してください。';
                hideProgress();
                startButton.disabled = false;
                retryButton.style.display = 'inline-block'; // 再試行ボタンを表示
                return;
            }
            
            // タイムアウト設定 (30秒)
            const timeout = setTimeout(() => {
                console.error("Kuromoji initialization timeout after 30 seconds");
                kuromojiStatusElement.textContent = '形態素解析器の初期化がタイムアウトしました。CDN接続またはネットワークの問題が考えられます。';
                hideProgress();
                startButton.disabled = false;
                retryButton.style.display = 'inline-block'; // 再試行ボタンを表示
            }, 30000);
            
            // 進捗表示用タイマー
            let progressPercent = 0;
            const progressInterval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                kuromojiStatusElement.textContent = `形態素解析器を初期化中... (${elapsed}秒経過)`;
                
                // 疑似的な進捗更新（実際の読み込み進捗は取得できないため）
                progressPercent = Math.min(progressPercent + Math.random() * 5, 85);
                updateProgress(progressPercent);
            }, 500);
            
            // 辞書ファイルのパスを指定
            const dicPath = "./dict/";
            console.log("Dictionary path:", dicPath);
            console.log("Current URL:", window.location.href);
            console.log("Base URL:", window.location.origin);
            console.log("Pathname:", window.location.pathname);
            
            // 辞書ファイルの存在確認
            fetch(dicPath + "base.dat")
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`辞書ファイルの読み込みに失敗: ${response.status} ${response.statusText}`);
                    }
                    console.log("辞書ファイルの読み込みに成功しました");
                    return response.arrayBuffer();
                })
                .then(buffer => {
                    console.log("辞書ファイルのサイズ:", buffer.byteLength);
                })
                .catch(error => {
                    console.error("辞書ファイルの読み込みエラー:", error);
                    kuromojiStatusElement.textContent = `辞書ファイルの読み込みに失敗しました: ${error.message} (音声認識は利用可能です)`;
                    // 辞書ファイルの読み込みに失敗しても音声認識は有効にする
                    startButton.disabled = false;
                });
            
            try {
                kuromoji.builder({ 
                    dicPath: dicPath,
                    debug: true,  // デバッグモードを有効化
                    gzip: false    // gzip圧縮を無効化
                })
                    .build((err, tokenizer) => {
                        clearTimeout(timeout);
                        clearInterval(progressInterval);
                        
                        const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
                        
                        if (err) {
                            console.error("Kuromoji initialization error:", err);
                            console.error("Error details:", {
                                message: err.message,
                                stack: err.stack,
                                dicPath: dicPath,
                                elapsedTime: elapsedTime,
                                location: window.location.href
                            });
                            kuromojiStatusElement.textContent = `形態素解析器の初期化に失敗しました (${elapsedTime}秒後): ${err.message || 'ネットワークエラーの可能性があります'} (音声認識は利用可能です)`;
                            hideProgress();
                            startButton.disabled = false;
                            retryButton.style.display = 'inline-block';
                            return;
                        }
                        
                        // 成功時は100%まで進捗を更新
                        updateProgress(100);
                        setTimeout(() => {
                            hideProgress();
                        }, 500);
                        
                        kuromojiTokenizer = tokenizer;
                        kuromojiStatusElement.textContent = `形態素解析器の準備ができました (${elapsedTime}秒で完了)`;
                        startButton.disabled = false;
                        retryButton.style.display = 'none'; // 成功時は再試行ボタンを非表示
                        console.log(`Kuromoji tokenizer initialized successfully in ${elapsedTime} seconds`);
                    });
            } catch (buildError) {
                clearTimeout(timeout);
                clearInterval(progressInterval);
                console.error("Error creating kuromoji builder:", buildError);
                kuromojiStatusElement.textContent = 'kuromoji.builderの作成に失敗しました: ' + buildError.message + ' (音声認識は利用可能です)';
                startButton.disabled = false;
                retryButton.style.display = 'inline-block'; // 再試行ボタンを表示
            }
        }

        function katakanaToHiragana(katakana) {
            return katakana.replace(/[\u30A1-\u30F6]/g, function(match) {
                const chr = match.charCodeAt(0) - 0x60;
                return String.fromCharCode(chr);
            });
        }

        function convertToHiragana(text) {
            if (!kuromojiTokenizer || !text.trim()) {
                return text; // 変換できない場合は原文を返すか、空文字が良いかも
            }
            try {
                const tokens = kuromojiTokenizer.tokenize(text);
                let hiragana = '';
                tokens.forEach(token => {
                    // reading がカタカナなのでひらがなにし、reading がない場合は surface_form を試す
                    if (token.reading && token.reading !== '*') {
                        hiragana += katakanaToHiragana(token.reading);
                    } else {
                        hiragana += katakanaToHiragana(token.surface_form);
                    }
                });
                return hiragana;
            } catch (error) {
                console.error("Error during hiragana conversion:", error);
                return text + " (ひらがな変換エラー)";
            }
        }

        // --- Web Speech API 関連 ---
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRecognition();

            recognition.lang = 'ja-JP';
            recognition.interimResults = true;
            recognition.continuous = true;

            recognition.onstart = () => {
                recognizing = true;
                statusElement.textContent = 'ステータス: 音声認識中... マイクに向かって話してください。';
                startButton.disabled = true;
                stopButton.disabled = false;
                if (!resumeAfterSpeech) { // ←ここを追加
                    finalTranscript = '';
                    resultTextElement.innerHTML = '';
                    hiraganaTextElement.textContent = '';
                }
                resumeAfterSpeech = false; // ←再開時は次回リセットされるように
                console.log('Speech recognition started.');
            };

            recognition.onresult = (event) => {
                let interimTranscript = '';
                let currentFullFinalTranscript = '';
                for (let i = 0; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        currentFullFinalTranscript += event.results[i][0].transcript;
                    }
                }
                let newFinalPortion = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    const transcriptPart = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcriptPart;
                        newFinalPortion += transcriptPart;
                    } else {
                        interimTranscript += transcriptPart;
                    }
                }
                resultTextElement.innerHTML = finalTranscript + (interimTranscript ? '<span class="interim">' + interimTranscript + '</span>' : '');
                if (finalTranscript && kuromojiTokenizer) {
                    const hiraganaResult = convertToHiragana(finalTranscript);
                    hiraganaTextElement.textContent = hiraganaResult;
                } else if (finalTranscript && !kuromojiTokenizer) {
                    hiraganaTextElement.textContent = finalTranscript + ' (かな変換待機中...)';
                } else if (!finalTranscript && interimTranscript === '') {
                    hiraganaTextElement.textContent = '';
                }
                // --- 履歴保存 ---
                if (newFinalPortion.trim()) {
                    recognitionHistory.push({
                        text: newFinalPortion.trim(),
                        date: new Date().toLocaleString('ja-JP', { hour12: false })
                    });
                }
            };

            recognition.onerror = (event) => {
                let errorMessage = `ステータス: エラーが発生しました - ${event.error}`;
                if (event.error === 'no-speech') {
                    errorMessage = 'ステータス: 音声が検出されませんでした。';
                } else if (event.error === 'audio-capture') {
                    errorMessage = 'ステータス: マイクが見つかりません。';
                } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    errorMessage = 'ステータス: マイクの使用が許可されていません。';
                }
                statusElement.textContent = errorMessage;
                console.error('Speech recognition error:', event.error, event.message);
                if (recognizing) {
                    recognition.stop();
                }
            };

            recognition.onend = () => {
                recognizing = false;
                statusElement.textContent = 'ステータス: 音声認識終了';
                if (kuromojiTokenizer) { // kuromojiが準備できていれば有効化
                    startButton.disabled = false;
                } // kuromoji準備中なら、まだstartButtonは無効のまま
                stopButton.disabled = true;
                console.log('Speech recognition ended.');
            };

            startButton.addEventListener('click', () => {
                if (!recognizing) {
                    try {
                        recognition.start();
                    } catch (e) {
                        console.error("Error starting recognition:", e);
                        statusElement.textContent = "ステータス: 認識開始エラー。";
                        alert("音声認識を開始できませんでした。");
                    }
                }
            });

            stopButton.addEventListener('click', () => {
                if (recognizing) {
                    recognition.stop();
                }
            });

        } else {
            statusElement.textContent = 'ステータス: お使いのブラウザは Web Speech API に対応していません。';
            kuromojiStatusElement.textContent = '';
            startButton.disabled = true;
            stopButton.disabled = true;
            alert('お使いのブラウザは Web Speech API に対応していません。');
        }

        if (clearButton) {
            clearButton.addEventListener('click', () => {
                resultTextElement.value = '';
                hiraganaTextElement.value = '';
                finalTranscript = '';
            });
        }

        // CDN接続テスト関数
        function testCDNConnectivity() {
            return new Promise((resolve, reject) => {
                const testUrl = 'https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/package.json';
                fetch(testUrl, { 
                    method: 'HEAD',
                    cache: 'no-cache',
                    mode: 'cors'
                })
                .then(response => {
                    if (response.ok) {
                        console.log('CDN connectivity test successful');
                        resolve(true);
                    } else {
                        console.warn('CDN connectivity test failed:', response.status, response.statusText);
                        reject(new Error(`CDN接続テスト失敗: ${response.status} ${response.statusText}`));
                    }
                })
                .catch(error => {
                    console.error('CDN connectivity test error:', error);
                    reject(error);
                });
            });
        }

        // デバッグ情報をログ出力
        function logEnvironmentInfo() {
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

        // 強化されたkuromoji初期化関数
        async function initializeKuromojiWithConnectivityCheck() {
            console.log('Starting kuromoji initialization with connectivity check...');
            
            // 環境情報をログ出力
            logEnvironmentInfo();
            
            kuromojiStatusElement.textContent = 'CDN接続を確認中...';
            
            try {
                // CDN接続テスト
                await testCDNConnectivity();
                kuromojiStatusElement.textContent = 'CDN接続確認完了。形態素解析器を初期化中...';
                
                // 少し待ってからkuromoji初期化
                setTimeout(initializeKuromoji, 500);
                
            } catch (connectivityError) {
                console.error('CDN connectivity failed:', connectivityError);
                kuromojiStatusElement.textContent = `CDN接続エラー: ${connectivityError.message}. ひらがな変換は無効になります。`;
                
                // CDN接続に失敗した場合は音声認識のみ利用可能にする
                setTimeout(() => {
                    kuromojiStatusElement.textContent += ' (音声認識は利用可能です)';
                    startButton.disabled = false;
                    retryButton.style.display = 'inline-block'; // 再試行ボタンを表示
                }, 2000);
            }
        }

        // 再試行ボタンのイベントリスナー
        retryButton.addEventListener('click', () => {
            console.log('Manual retry button clicked');
            retryButton.style.display = 'none';
            kuromojiTokenizer = null; // リセット
            initializeKuromojiWithConnectivityCheck();
        });

        // ページ読み込み時に kuromoji.js を初期化
        window.addEventListener('load', initializeKuromojiWithConnectivityCheck);


