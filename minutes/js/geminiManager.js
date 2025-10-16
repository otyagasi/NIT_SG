// Gemini API管理クラス
class GeminiManager {
    constructor() {
        this.apiKey = null;
        this.apiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
        this.logger = window.debugLogger;
        this.vibeLogger = window.vibeLogger;

        // コールバック関数
        this.onStatusCallback = null;

        this.logger.info('GeminiManager', 'GeminiManager初期化');
        this.vibeLogger.info('GeminiManager', 'GeminiManager初期化開始', {
            humanNote: 'Gemini APIマネージャーの初期化を開始しました',
            aiTodo: 'APIキーの検証と保存を確認してください'
        });
    }

    // ステータス更新コールバックを設定
    setOnStatusCallback(callback) {
        this.onStatusCallback = callback;
    }

    // ステータスを更新
    updateStatus(message, type = 'info') {
        this.logger.info('GeminiManager', `Status: ${message}`, { type });
        if (this.onStatusCallback) {
            this.onStatusCallback(message, type);
        }
    }

    // APIキーを設定
    setApiKey(apiKey) {
        if (!apiKey || apiKey.trim() === '') {
            this.logger.warn('GeminiManager', 'APIキーが空です');
            return false;
        }

        this.apiKey = apiKey.trim();
        this.logger.info('GeminiManager', 'APIキーを設定しました');

        // LocalStorageに保存（オプション - セキュリティ上の懸念がある場合は削除）
        try {
            localStorage.setItem('gemini_api_key', this.apiKey);
            this.logger.debug('GeminiManager', 'APIキーをLocalStorageに保存しました');
        } catch (error) {
            this.logger.error('GeminiManager', 'APIキーの保存に失敗', error);
        }

        return true;
    }

    // LocalStorageからAPIキーを読み込み
    loadApiKeyFromStorage() {
        try {
            const savedKey = localStorage.getItem('gemini_api_key');
            if (savedKey) {
                this.apiKey = savedKey;
                this.logger.info('GeminiManager', 'LocalStorageからAPIキーを読み込みました');
                return true;
            }
        } catch (error) {
            this.logger.error('GeminiManager', 'APIキーの読み込みに失敗', error);
        }
        return false;
    }

    // APIキーを取得
    getApiKey() {
        return this.apiKey;
    }

    // APIキーが設定されているか確認
    hasApiKey() {
        return this.apiKey !== null && this.apiKey.trim() !== '';
    }

    // APIキーをクリア
    clearApiKey() {
        this.apiKey = null;
        try {
            localStorage.removeItem('gemini_api_key');
            this.logger.info('GeminiManager', 'APIキーをクリアしました');
        } catch (error) {
            this.logger.error('GeminiManager', 'APIキーのクリアに失敗', error);
        }
    }

    // APIキーの検証（実際にAPIを呼び出してテスト）
    async verifyApiKey(apiKey = null) {
        const keyToVerify = apiKey || this.apiKey;

        if (!keyToVerify) {
            const error = 'APIキーが設定されていません';
            this.logger.error('GeminiManager', error);
            this.updateStatus(error, 'error');
            return {
                success: false,
                message: error
            };
        }

        this.logger.info('GeminiManager', 'APIキーの検証を開始');
        this.updateStatus('APIキーを検証中...', 'info');

        try {
            // テスト用の簡単なプロンプトでAPI呼び出し
            const testPrompt = 'こんにちは';
            const response = await this.callGeminiAPI(testPrompt, keyToVerify);

            if (response.success) {
                this.logger.info('GeminiManager', 'APIキーの検証に成功');
                this.updateStatus('APIキーの検証に成功しました', 'success');

                // 検証成功時にAPIキーを保存
                if (apiKey) {
                    this.setApiKey(apiKey);
                }

                return {
                    success: true,
                    message: 'APIキーは有効です',
                    response: response.data
                };
            } else {
                this.logger.error('GeminiManager', 'APIキーの検証に失敗', response.error);
                this.updateStatus('APIキーの検証に失敗しました', 'error');
                return {
                    success: false,
                    message: response.error || 'APIキーが無効です'
                };
            }
        } catch (error) {
            this.logger.error('GeminiManager', 'APIキーの検証中にエラー', error);
            this.updateStatus('検証中にエラーが発生しました', 'error');
            return {
                success: false,
                message: error.message || '検証中にエラーが発生しました'
            };
        }
    }

    // Gemini APIを呼び出し
    async callGeminiAPI(prompt, apiKey = null) {
        const keyToUse = apiKey || this.apiKey;

        if (!keyToUse) {
            return {
                success: false,
                error: 'APIキーが設定されていません'
            };
        }

        this.logger.info('GeminiManager', 'Gemini APIを呼び出し中', { promptLength: prompt.length });
        this.vibeLogger.info('GeminiManager', 'Gemini API呼び出し開始', {
            humanNote: 'Gemini APIにリクエストを送信しています',
            context: { promptLength: prompt.length },
            aiTodo: 'APIレスポンスを確認してエラーハンドリングを実装してください'
        });

        try {
            const requestBody = {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            };

            const url = `${this.apiEndpoint}?key=${keyToUse}`;

            this.logger.debug('GeminiManager', 'APIリクエスト送信', { url: this.apiEndpoint });

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            this.logger.debug('GeminiManager', 'APIレスポンス受信', { status: response.status });

            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error('GeminiManager', 'API呼び出し失敗', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorText
                });

                return {
                    success: false,
                    error: `API Error: ${response.status} - ${response.statusText}`,
                    details: errorText
                };
            }

            const data = await response.json();
            this.logger.info('GeminiManager', 'API呼び出し成功');

            // レスポンスからテキストを抽出
            const generatedText = this.extractTextFromResponse(data);

            return {
                success: true,
                data: generatedText,
                rawResponse: data
            };

        } catch (error) {
            this.logger.error('GeminiManager', 'API呼び出し中に例外発生', error);
            return {
                success: false,
                error: error.message || 'API呼び出し中にエラーが発生しました'
            };
        }
    }

    // レスポンスからテキストを抽出
    extractTextFromResponse(response) {
        try {
            if (response.candidates && response.candidates.length > 0) {
                const candidate = response.candidates[0];
                if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                    return candidate.content.parts[0].text;
                }
            }
            this.logger.warn('GeminiManager', 'レスポンスからテキストを抽出できませんでした', response);
            return '';
        } catch (error) {
            this.logger.error('GeminiManager', 'テキスト抽出中にエラー', error);
            return '';
        }
    }

    // 音声認識テキストを要約
    async summarizeText(text) {
        if (!text || text.trim() === '') {
            return {
                success: false,
                error: '要約するテキストがありません'
            };
        }

        if (!this.hasApiKey()) {
            return {
                success: false,
                error: 'APIキーが設定されていません'
            };
        }

        this.logger.info('GeminiManager', 'テキスト要約を開始', { textLength: text.length });
        this.updateStatus('テキストを要約中...', 'info');

        const prompt = `以下の音声認識テキストを要約してください。主要なポイントを簡潔にまとめてください。\n\n${text}`;

        try {
            const response = await this.callGeminiAPI(prompt);

            if (response.success) {
                this.logger.info('GeminiManager', 'テキスト要約完了');
                this.updateStatus('要約が完了しました', 'success');
                return {
                    success: true,
                    summary: response.data
                };
            } else {
                this.logger.error('GeminiManager', '要約に失敗', response.error);
                this.updateStatus('要約に失敗しました', 'error');
                return {
                    success: false,
                    error: response.error
                };
            }
        } catch (error) {
            this.logger.error('GeminiManager', '要約中にエラー', error);
            this.updateStatus('要約中にエラーが発生しました', 'error');
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 話者認識テキストを要約（話者情報を含む）
    async summarizeSpeakerText(speakerTexts) {
        if (!speakerTexts || Object.keys(speakerTexts).length === 0) {
            return {
                success: false,
                error: '要約するテキストがありません'
            };
        }

        if (!this.hasApiKey()) {
            return {
                success: false,
                error: 'APIキーが設定されていません'
            };
        }

        this.logger.info('GeminiManager', '話者認識テキスト要約を開始', {
            speakerCount: Object.keys(speakerTexts).length
        });
        this.updateStatus('話者認識テキストを要約中...', 'info');

        // 話者ごとのテキストを整形
        let formattedText = '以下は複数の話者による会話の文字起こしです。各話者の発言内容を要約してください。\n\n';

        for (const [speaker, text] of Object.entries(speakerTexts)) {
            formattedText += `【${speaker}】\n${text}\n\n`;
        }

        try {
            const response = await this.callGeminiAPI(formattedText);

            if (response.success) {
                this.logger.info('GeminiManager', '話者認識テキスト要約完了');
                this.updateStatus('要約が完了しました', 'success');
                return {
                    success: true,
                    summary: response.data
                };
            } else {
                this.logger.error('GeminiManager', '要約に失敗', response.error);
                this.updateStatus('要約に失敗しました', 'error');
                return {
                    success: false,
                    error: response.error
                };
            }
        } catch (error) {
            this.logger.error('GeminiManager', '要約中にエラー', error);
            this.updateStatus('要約中にエラーが発生しました', 'error');
            return {
                success: false,
                error: error.message
            };
        }
    }

    // デバッグ情報を取得
    getDebugInfo() {
        return {
            hasApiKey: this.hasApiKey(),
            apiKeyLength: this.apiKey ? this.apiKey.length : 0,
            apiEndpoint: this.apiEndpoint
        };
    }
}

// グローバルスコープで利用可能にする
window.GeminiManager = GeminiManager;
