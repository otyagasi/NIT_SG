 const startButton = document.getElementById('startButton');
        const stopButton = document.getElementById('stopButton');
        const resultTextElement = document.getElementById('resultText');
        const hiraganaTextElement = document.getElementById('hiraganaText');
        const statusElement = document.getElementById('status');
        const kuromojiStatusElement = document.getElementById('kuromojiStatus');

        let recognition;
        let recognizing = false;
        let finalTranscript = '';
        let kuromojiTokenizer = null;

        // --- kuromoji.js と ひらがな変換関連 ---
        function initializeKuromoji() {
            kuromojiStatusElement.textContent = '形態素解析器を初期化中... (数秒かかることがあります)';
            console.log("Initializing kuromoji.js tokenizer...");
            // 辞書ファイルのパスを指定 (CDNから取得)
            kuromoji.builder({ dicPath: "https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/" })
                .build((err, tokenizer) => {
                    if (err) {
                        console.error("Kuromoji initialization error:", err);
                        kuromojiStatusElement.textContent = '形態素解析器の初期化に失敗しました。ひらがな変換は利用できません。';
                        startButton.disabled = false; // 認識自体はできるようにする
                        return;
                    }
                    kuromojiTokenizer = tokenizer;
                    kuromojiStatusElement.textContent = '形態素解析器の準備ができました。';
                    startButton.disabled = false; // 準備完了後、開始ボタンを有効化
                    console.log("Kuromoji tokenizer initialized.");
                });
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
                finalTranscript = '';
                resultTextElement.innerHTML = '';
                hiraganaTextElement.textContent = '';
                console.log('Speech recognition started.');
            };

            recognition.onresult = (event) => {
                let interimTranscript = '';
                // finalTranscript はこのセッションの開始から現在までの確定した全テキスト
                // speechRecognitionインスタンスが保持するものではなく、ここで構築する
                let currentFullFinalTranscript = '';

                for (let i = 0; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        currentFullFinalTranscript += event.results[i][0].transcript;
                    }
                }
                // 上記だと、古い確定結果が連続して何度も追加されてしまう。
                // 正しくは、onstartでfinalTranscriptを初期化し、
                // isFinalの度にそこに追記していく。

                // 修正: finalTranscriptはグローバル変数で、イベントごとに追記・更新する
                let newFinalPortion = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    const transcriptPart = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcriptPart; // グローバルなfinalTranscriptに追記
                        newFinalPortion += transcriptPart; // 今回のイベントで確定した部分
                    } else {
                        interimTranscript += transcriptPart;
                    }
                }

                resultTextElement.innerHTML = finalTranscript + '<span class="interim">' + interimTranscript + '</span>';

                if (finalTranscript && kuromojiTokenizer) { // finalTranscript全体を毎回変換
                    const hiraganaResult = convertToHiragana(finalTranscript);
                    hiraganaTextElement.textContent = hiraganaResult;
                } else if (finalTranscript && !kuromojiTokenizer) {
                    hiraganaTextElement.textContent = finalTranscript + ' (かな変換待機中...)';
                } else if (!finalTranscript && interimTranscript === '') {
                    hiraganaTextElement.textContent = '';
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
                if (!recognizing && kuromojiTokenizer) { // kuromojiの準備も確認
                    try {
                        recognition.start();
                    } catch (e) {
                        console.error("Error starting recognition:", e);
                        statusElement.textContent = "ステータス: 認識開始エラー。";
                        alert("音声認識を開始できませんでした。");
                    }
                } else if (!kuromojiTokenizer) {
                    alert("形態素解析器がまだ準備中です。少々お待ちください。");
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

        // ページ読み込み時に kuromoji.js を初期化
        window.addEventListener('load', initializeKuromoji);
