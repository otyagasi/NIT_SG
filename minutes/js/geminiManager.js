// Gemini API管理クラス（Google GenAI SDK使用）
class GeminiManager {
    constructor() {
        this.apiKey = null;
        this.genAI = null;
        this.model = null;
        this.logger = window.debugLogger;
        this.vibeLogger = window.vibeLogger;

        // コールバック関数
        this.onStatusCallback = null;
        this.onTokenUpdateCallback = null;
        this.onRateLimitUpdateCallback = null;

        // トークン使用量情報
        this.lastTokenUsage = null;

        // レート制限トラッキング
        this.rateLimitTracker = {
            requestsThisMinute: [],
            tokensThisMinute: [],
            requestsThisDay: [],
            modelLimits: {
                'gemini-2.0-flash-exp': { rpm: 15, tpm: 1000000, rpd: 1500 },
                'gemini-2.5-flash': { rpm: 10, tpm: 250000, rpd: 1000 },
                'gemini-1.5-flash': { rpm: 1000, tpm: 4000000, rpd: null }, // 制限なし
                'gemini-1.5-pro': { rpm: 360, tpm: 4000000, rpd: null }
            },
            currentModel: 'gemini-2.0-flash-exp'
        };

        // LocalStorageからRPDデータを読み込み
        this.loadRPDFromStorage();

        this.logger.info('GeminiManager', 'GeminiManager初期化');
        this.vibeLogger.info('GeminiManager', 'GeminiManager初期化開始', {
            humanNote: 'Gemini APIマネージャーの初期化を開始しました',
            aiTodo: 'APIキーの検証と保存を確認してください'
        });
    }

    // LocalStorageからRPDデータを読み込み
    loadRPDFromStorage() {
        try {
            const savedRPD = localStorage.getItem('gemini_rpd_tracker');
            if (savedRPD) {
                const data = JSON.parse(savedRPD);
                // 今日のデータのみを保持（古いデータをクリーンアップ）
                const today = new Date().toDateString();
                if (data.date === today && Array.isArray(data.requests)) {
                    this.rateLimitTracker.requestsThisDay = data.requests;
                    this.logger.info('GeminiManager', 'RPDデータを読み込み', {
                        requestCount: data.requests.length
                    });
                } else {
                    // 日付が変わった場合はクリア
                    this.rateLimitTracker.requestsThisDay = [];
                    this.saveRPDToStorage();
                }
            }
        } catch (error) {
            this.logger.error('GeminiManager', 'RPDデータの読み込みに失敗', error);
            this.rateLimitTracker.requestsThisDay = [];
        }
    }

    // LocalStorageにRPDデータを保存
    saveRPDToStorage() {
        try {
            const today = new Date().toDateString();
            const data = {
                date: today,
                requests: this.rateLimitTracker.requestsThisDay
            };
            localStorage.setItem('gemini_rpd_tracker', JSON.stringify(data));
            this.logger.debug('GeminiManager', 'RPDデータを保存', {
                requestCount: data.requests.length
            });
        } catch (error) {
            this.logger.error('GeminiManager', 'RPDデータの保存に失敗', error);
        }
    }

    // ステータス更新コールバックを設定
    setOnStatusCallback(callback) {
        this.onStatusCallback = callback;
    }

    // トークン更新コールバックを設定
    setOnTokenUpdateCallback(callback) {
        this.onTokenUpdateCallback = callback;
    }

    // レート制限更新コールバックを設定
    setOnRateLimitUpdateCallback(callback) {
        this.onRateLimitUpdateCallback = callback;
    }

    // ステータスを更新
    updateStatus(message, type = 'info') {
        this.logger.info('GeminiManager', `Status: ${message}`, { type });
        if (this.onStatusCallback) {
            this.onStatusCallback(message, type);
        }
    }

    // トークン使用量を更新
    updateTokenUsage(usageMetadata) {
        this.lastTokenUsage = usageMetadata;
        this.logger.info('GeminiManager', 'トークン使用量を更新', usageMetadata);

        if (this.onTokenUpdateCallback) {
            this.onTokenUpdateCallback(usageMetadata);
        }
    }

    // レート制限トラッキングを更新
    trackRateLimitUsage(modelName, tokenCount) {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;

        // 1分以上前のデータを削除
        this.rateLimitTracker.requestsThisMinute = this.rateLimitTracker.requestsThisMinute.filter(
            timestamp => timestamp > oneMinuteAgo
        );
        this.rateLimitTracker.tokensThisMinute = this.rateLimitTracker.tokensThisMinute.filter(
            entry => entry.timestamp > oneMinuteAgo
        );

        // 新しいリクエストを追加
        this.rateLimitTracker.requestsThisMinute.push(now);
        this.rateLimitTracker.tokensThisMinute.push({
            timestamp: now,
            count: tokenCount
        });

        // 1日のリクエストも記録
        this.rateLimitTracker.requestsThisDay.push(now);

        // LocalStorageに保存
        this.saveRPDToStorage();

        this.rateLimitTracker.currentModel = modelName;

        // 使用状況を計算
        const usageStats = this.getRateLimitStats();

        this.logger.info('GeminiManager', 'レート制限使用状況を更新', usageStats);

        if (this.onRateLimitUpdateCallback) {
            this.onRateLimitUpdateCallback(usageStats);
        }
    }

    // レート制限統計を取得
    getRateLimitStats() {
        const currentLimits = this.rateLimitTracker.modelLimits[this.rateLimitTracker.currentModel] ||
                             { rpm: 15, tpm: 1000000, rpd: null };

        const requestsUsed = this.rateLimitTracker.requestsThisMinute.length;
        const tokensUsed = this.rateLimitTracker.tokensThisMinute.reduce(
            (sum, entry) => sum + entry.count, 0
        );

        const requestsRemaining = Math.max(0, currentLimits.rpm - requestsUsed);
        const tokensRemaining = Math.max(0, currentLimits.tpm - tokensUsed);

        // RPD（1日あたりのリクエスト数）統計
        const requestsPerDayUsed = this.rateLimitTracker.requestsThisDay.length;
        let dailyStats = null;
        if (currentLimits.rpd !== null) {
            dailyStats = {
                used: requestsPerDayUsed,
                limit: currentLimits.rpd,
                remaining: Math.max(0, currentLimits.rpd - requestsPerDayUsed),
                percentage: (requestsPerDayUsed / currentLimits.rpd * 100).toFixed(1)
            };
        }

        return {
            model: this.rateLimitTracker.currentModel,
            requests: {
                used: requestsUsed,
                limit: currentLimits.rpm,
                remaining: requestsRemaining,
                percentage: (requestsUsed / currentLimits.rpm * 100).toFixed(1)
            },
            tokens: {
                used: tokensUsed,
                limit: currentLimits.tpm,
                remaining: tokensRemaining,
                percentage: (tokensUsed / currentLimits.tpm * 100).toFixed(1)
            },
            daily: dailyStats
        };
    }

    // APIキーを設定
    setApiKey(apiKey) {
        if (!apiKey || apiKey.trim() === '') {
            this.logger.warn('GeminiManager', 'APIキーが空です');
            return false;
        }

        this.apiKey = apiKey.trim();
        this.logger.info('GeminiManager', 'APIキーを設定しました');

        // Google GenAI SDKの初期化
        try {
            // ブラウザ環境ではCDNから読み込まれたGoogleGenAIを使用
            if (typeof GoogleGenAI !== 'undefined') {
                this.genAI = new GoogleGenAI({ apiKey: this.apiKey });
                this.logger.info('GeminiManager', 'Google GenAI SDK初期化成功');
            } else {
                this.logger.error('GeminiManager', 'Google GenAI SDKが読み込まれていません');
                return false;
            }
        } catch (error) {
            this.logger.error('GeminiManager', 'Google GenAI SDK初期化失敗', error);
            return false;
        }

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
                this.setApiKey(savedKey);
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
        this.genAI = null;
        this.model = null;
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
            // 新しいAPIキーの場合は一時的にSDKを初期化
            let tempGenAI = this.genAI;
            if (apiKey && apiKey !== this.apiKey) {
                if (typeof GoogleGenAI !== 'undefined') {
                    tempGenAI = new GoogleGenAI({ apiKey: keyToVerify });
                } else {
                    throw new Error('Google GenAI SDKが読み込まれていません');
                }
            }

            if (!tempGenAI) {
                throw new Error('Google GenAI SDKが初期化されていません');
            }

            // テスト用の簡単なプロンプトでAPI呼び出し
            const response = await tempGenAI.models.generateContent({
                model: "gemini-2.0-flash-exp",
                contents: "こんにちは"
            });

            const text = response.text;

            // トークン使用量を取得
            if (response.usageMetadata) {
                this.updateTokenUsage(response.usageMetadata);
            }

            this.logger.info('GeminiManager', 'APIキーの検証に成功', { responseLength: text.length });
            this.updateStatus('APIキーの検証に成功しました', 'success');

            // 検証成功時にAPIキーを保存
            if (apiKey) {
                this.setApiKey(apiKey);
            }

            return {
                success: true,
                message: 'APIキーは有効です',
                response: text
            };

        } catch (error) {
            this.logger.error('GeminiManager', 'APIキーの検証に失敗', error);
            this.updateStatus('APIキーの検証に失敗しました', 'error');

            let errorMessage = 'APIキーが無効です';
            if (error.message) {
                errorMessage = error.message;
            }

            console.error('Gemini API Verification Error:', error);

            return {
                success: false,
                message: errorMessage
            };
        }
    }

    // Gemini APIを呼び出し（リトライ機能付き）
    async callGeminiAPI(prompt, modelName = "gemini-2.0-flash-exp", retryCount = 3, retryDelay = 2000) {
        if (!this.hasApiKey() || !this.genAI) {
            return {
                success: false,
                error: 'APIキーが設定されていません'
            };
        }

        this.logger.info('GeminiManager', 'Gemini APIを呼び出し中', {
            promptLength: prompt.length,
            model: modelName,
            retryCount
        });
        this.vibeLogger.info('GeminiManager', 'Gemini API呼び出し開始', {
            humanNote: 'Gemini APIにリクエストを送信しています',
            context: { promptLength: prompt.length, model: modelName },
            aiTodo: 'APIレスポンスを確認してエラーハンドリングを実装してください'
        });

        // リトライロジック
        for (let attempt = 1; attempt <= retryCount; attempt++) {
            try {
                console.log('Gemini API Request:', {
                    model: modelName,
                    promptLength: prompt.length,
                    attempt,
                    maxRetries: retryCount
                });

                const response = await this.genAI.models.generateContent({
                    model: modelName,
                    contents: prompt
                });

                const text = response.text;

                // トークン使用量を取得
                if (response.usageMetadata) {
                    this.updateTokenUsage(response.usageMetadata);

                    // レート制限トラッキングを更新
                    const totalTokens = response.usageMetadata.totalTokenCount || 0;
                    this.trackRateLimitUsage(modelName, totalTokens);
                }

                console.log('Gemini API Response:', {
                    success: true,
                    responseLength: text.length,
                    usageMetadata: response.usageMetadata,
                    attempt
                });

                this.logger.info('GeminiManager', 'API呼び出し成功', {
                    responseLength: text.length,
                    usageMetadata: response.usageMetadata,
                    attempt
                });

                return {
                    success: true,
                    data: text,
                    rawResponse: response,
                    usageMetadata: response.usageMetadata
                };

            } catch (error) {
                const errorCode = error.code || error.status;
                const errorMessage = error.message || 'API呼び出し中にエラーが発生しました';

                this.logger.error('GeminiManager', `API呼び出し失敗 (試行 ${attempt}/${retryCount})`, {
                    error: errorMessage,
                    code: errorCode,
                    attempt
                });

                console.error('Gemini API Error:', {
                    error,
                    attempt,
                    maxRetries: retryCount
                });

                // リトライ可能なエラーかチェック
                const isRetryable = errorCode === 503 ||
                                   errorCode === 429 ||
                                   errorCode === 500 ||
                                   error.status === 'UNAVAILABLE' ||
                                   error.status === 'RESOURCE_EXHAUSTED';

                // 最後の試行でない、かつリトライ可能なエラーの場合は再試行
                if (attempt < retryCount && isRetryable) {
                    const waitTime = retryDelay * attempt; // 指数バックオフ
                    this.logger.info('GeminiManager', `${waitTime}ms待機後に再試行します...`, { attempt });
                    this.updateStatus(`API過負荷: ${waitTime/1000}秒後に再試行... (${attempt}/${retryCount})`, 'info');

                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    continue;
                }

                // リトライ不可能、または最後の試行の場合はエラーを返す
                return {
                    success: false,
                    error: {
                        code: errorCode,
                        message: errorMessage,
                        status: error.status
                    }
                };
            }
        }

        // ここには到達しないはずだが、念のため
        return {
            success: false,
            error: 'すべてのリトライが失敗しました'
        };
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

        const prompt = `以下の音声認識テキストを要約してください。主要なポイントを簡潔にまとめてください。また、文脈上で誤認識されている可能性が高い部分は修正した上で要約を行い、主要なポイントを簡潔にまとめてください。出力内容は、主要なポイントと要約のみにしてください。\n\n${text}`;

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

    // 単一テキストから話者を識別してJSON形式で返す
    async identifySpeakers(text) {
        if (!text || text.trim() === '') {
            return {
                success: false,
                error: '識別するテキストがありません'
            };
        }

        if (!this.hasApiKey()) {
            return {
                success: false,
                error: 'APIキーが設定されていません'
            };
        }

        this.logger.info('GeminiManager', '話者識別を開始', { textLength: text.length });
        this.updateStatus('話者を識別中...', 'info');

        const prompt = `あなたは会議の議事録作成の専門家です。以下の音声認識テキストには複数の話者が含まれています。
音声認識による誤変換や誤認識を文脈から推測して修正し、各発言を識別して、発言ごとに話者名と修正後の発言内容をJSON形式で出力してください。

## 出力形式:
{
  "utterances": [
    {
      "name": "話者名",
      "text": "修正後の発言内容"
    }
  ]
}

## タスク手順:
1. テキスト全体を読み、会話の文脈とテーマを理解する
2. 不自然な単語や表現を特定する
3. 文脈に基づいて正しい単語に修正する（特にカタカナ語・ビジネス用語）
4. 話者を識別して発言を分割する
5. JSON形式で出力する

## 話者識別ルール:
- 「○○です」という自己紹介パターンから話者名を抽出
- 話者名が明示されていない場合は直前の話者を継続、または「話者A」「話者B」と命名
- 発言は時系列順に並べ、各発言ごとに別のオブジェクトとして記録
- 自己紹介部分も1つの発言として記録

## 音声認識誤認識の修正（重要）:
**必ず以下の修正を実行してください:**

### 修正すべき典型的なパターン:
- 「法マット」→「フォーマット」（カタカナ語の誤変換）
- 「プレゼント」→「プレゼン」（ビジネス用語の短縮形）
- 「こうせい」→文脈に応じて「構成」「校正」「更正」などに修正
- 「テスト」が不自然な場合→「デスク」「デス」などを検討
- 「以上」→文脈により「異常」「意匠」に修正
- 数字の統一（「10」「十」「じゅう」を文脈に応じて統一）
- 助詞の誤り（「を」「に」「は」「が」の誤用）
- 不自然な文節区切りや句読点の修正

### 修正の原則:
1. **文脈最優先**: 前後の文脈から最も自然な単語を選択
2. **ビジネス用語**: 会議で使われる一般的な用語を優先（フォーマット、プロジェクト、スケジュール等）
3. **カタカナ語**: 不自然な漢字変換はカタカナ語を検討
4. **専門用語**: 業界用語や部署名は文脈から推測して修正
5. **最小限の修正**: 確実に誤りと判断できるもののみ修正し、元の発話の意図を保持

## 出力ルール:
- 出力はJSON形式のみで、説明文や注釈は一切不要
- JSONは必ず有効な形式で出力
- コードブロック（\`\`\`json）は使用可能

## 入力テキスト:
${text}`;

        try {
            const response = await this.callGeminiAPI(prompt);

            if (response.success) {
                this.logger.info('GeminiManager', '話者識別完了');
                this.updateStatus('話者識別が完了しました', 'success');

                // JSONパースを試みる
                try {
                    // レスポンスからJSON部分を抽出
                    let jsonText = response.data.trim();

                    // コードブロックマーカーを削除
                    jsonText = jsonText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');

                    const parsedData = JSON.parse(jsonText);

                    return {
                        success: true,
                        speakerData: parsedData,
                        rawResponse: response.data
                    };
                } catch (parseError) {
                    this.logger.error('GeminiManager', 'JSON解析エラー', parseError);
                    this.logger.debug('GeminiManager', 'Raw response', response.data);

                    // JSON解析失敗時も元のレスポンスを返す
                    return {
                        success: true,
                        speakerData: null,
                        rawResponse: response.data,
                        parseError: 'JSONの解析に失敗しました。生データを確認してください。'
                    };
                }
            } else {
                this.logger.error('GeminiManager', '話者識別に失敗', response.error);
                this.updateStatus('話者識別に失敗しました', 'error');
                return {
                    success: false,
                    error: response.error
                };
            }
        } catch (error) {
            this.logger.error('GeminiManager', '話者識別中にエラー', error);
            this.updateStatus('話者識別中にエラーが発生しました', 'error');
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 最後のトークン使用量を取得
    getLastTokenUsage() {
        return this.lastTokenUsage;
    }

    // デバッグ情報を取得
    getDebugInfo() {
        return {
            hasApiKey: this.hasApiKey(),
            apiKeyLength: this.apiKey ? this.apiKey.length : 0,
            hasGenAI: this.genAI !== null,
            sdkAvailable: typeof GoogleGenAI !== 'undefined',
            lastTokenUsage: this.lastTokenUsage
        };
    }
}

// グローバルスコープで利用可能にする
window.GeminiManager = GeminiManager;
