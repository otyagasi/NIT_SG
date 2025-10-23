// タイムライン管理クラス
class TimelineManager {
    constructor() {
        this.timelineContent = null;
        this.recordButton = null;
        this.timelineItems = [];
        this.utterances = []; // JSON出力用
        // フェーズ管理: idle -> name(録音中) -> awaitText -> text(録音中) -> idle
        this.phase = 'idle';
        this.buffer = '';
        this.pendingName = '';
        // 名前ごとの色割り当て
        this.nameToColorIndex = new Map();
        this.palette = [
            { bg: '#FFD7B5', border: '#FF9F5A' }, // 0: orange
            { bg: '#C4E1F6', border: '#5FA8D3' }, // 1: blue
            { bg: '#CDECCF', border: '#65C27C' }, // 2: green
            { bg: '#E5D1FF', border: '#A07BEA' }, // 3: purple
            { bg: '#FFD6E7', border: '#FF7EB6' }, // 4: pink
            { bg: '#CFF5F2', border: '#39C5BC' }, // 5: teal
            { bg: '#FFF3B0', border: '#F2C14E' }, // 6: yellow
            { bg: '#E0E7FF', border: '#6366F1' }  // 7: indigo
        ];
        this.logger = window.debugLogger;
        this.onRecordToggle = null; // 録音開始/停止の通知コールバック
        
        this.logger.info('TimelineManager', 'TimelineManager初期化');
    }
    
    setElements(domElements) {
        this.timelineContent = document.getElementById('timelineContent');
        this.recordButton = document.getElementById('recordButton');
        this.exportButton = document.getElementById('exportJsonButton');
        
        if (!this.timelineContent || !this.recordButton) {
            this.logger.error('TimelineManager', 'タイムライン要素が見つかりません');
            return false;
        }
        
        this.setupEventListeners();
        this.addDemoItems(); // デモ用のアイテムを追加
        
        return true;
    }
    
    setupEventListeners() {
        // 録音ボタンのクリックイベント
        if (this.recordButton) {
            this.recordButton.addEventListener('click', (e) => {
                this.toggleRecording();
            });
        }

        if (this.exportButton) {
            this.exportButton.addEventListener('click', () => {
                const json = this.exportUtterancesJSON();
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const ts = new Date().toISOString().replace(/[:]/g,'-').slice(0,19);
                a.download = `timeline-${ts}.json`;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
            });
        }
        
        // タイムラインタブのクリックイベント
        const timelineTabs = document.querySelectorAll('.timeline-tab');
        timelineTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                // すべてのタブから active クラスを削除
                timelineTabs.forEach(t => t.classList.remove('active'));
                // クリックされたタブに active クラスを追加
                e.target.classList.add('active');
            });
        });
    }
    
    toggleRecording() {
        const isRecording = this.recordButton.classList.contains('recording');
        const next = !isRecording;

        // フェーズ制御
        if (next) {
            // 録音開始
            if (this.phase === 'idle') {
                this.phase = 'name';
                this.buffer = '';
                this.showPhaseToast('話者名を話してください');
            } else if (this.phase === 'awaitText') {
                this.phase = 'text';
                this.buffer = '';
                this.showPhaseToast('内容を話してください');
            }
        } else {
            // 録音停止
            if (this.phase === 'name') {
                this.pendingName = this.normalizeName(this.buffer);
                if (!this.pendingName && this.timelineItems.length === 0) {
                    // しょっぱなに氏名が出なかった場合、テキスト頭から簡易抽出
                    this.pendingName = this.tryExtractName(this.buffer);
                }
                this.phase = 'awaitText';
                this.showPhaseToast(`話者「${this.pendingName || '未設定'}」を記録しました`);
            } else if (this.phase === 'text') {
                const text = this.buffer.trim();
                if (!this.pendingName) {
                    // 内容の頭に「○○です。」等が含まれていたら抽出
                    const guess = this.tryExtractName(text);
                    if (guess) {
                        this.pendingName = guess;
                    }
                }
                if (this.pendingName || text) {
                    this.addUtterance(this.pendingName || '無名', text || '');
                }
                this.pendingName = '';
                this.phase = 'idle';
            }
        }

        this.setRecordingUI(next);
        this.logger.info('TimelineManager', next ? '録音開始' : '録音停止');
        if (typeof this.onRecordToggle === 'function') {
            try { this.onRecordToggle(next); } catch (e) { console.error(e); }
        }
    }

    // 外部（main.js）からUIだけ同期したいときに使用
    setRecordingUI(isRecording) {
        if (!this.recordButton) return;
        if (isRecording) {
            this.recordButton.classList.add('recording');
        } else {
            this.recordButton.classList.remove('recording');
        }
    }

    // 録音開始/停止のトグル通知を受け取るコールバックを設定
    setOnRecordToggle(callback) {
        this.onRecordToggle = callback;
    }

    // フェーズの案内を表示
    showPhaseToast(message) {
        // まず左側のステータスに表示（あれば）
        try {
            const ui = window.webSpeechApp && window.webSpeechApp.uiManager;
            if (ui && typeof ui.showStatus === 'function') {
                ui.showStatus('ステータス: ' + message, 'info');
            }
        } catch (e) {}

        // 右側にも一時的なトーストを表示
        const container = this.recordButton ? this.recordButton.parentElement : null;
        if (!container) return;
        const existing = container.querySelector('.timeline-tooltip.phase-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'timeline-tooltip phase-toast show';
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
        }, 1200);
    }
    
    addTimelineItem(name, text) {
        const now = new Date();
        const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const item = {
            name: name,
            text: text,
            time: time,
            timestamp: Date.now()
        };
        
        this.timelineItems.push(item);
        this.renderTimelineItem(item);
        
        // 最新のアイテムまでスクロール
        this.scrollToBottom();
        
        this.logger.info('TimelineManager', 'タイムラインアイテム追加', { name, text, time });
    }

    // 音声認識の確定結果から追加するヘルパー
    appendFromRecognition(text) {
        const cleaned = (text || '').trim();
        if (!cleaned) return;
        // フェーズ中のバッファに追記
        if (this.phase === 'name' || this.phase === 'text') {
            this.buffer += cleaned;
        }
    }

    // 新しい発話データを作成＆描画
    addUtterance(name, text) {
        const trimmedName = (name || '').trim();
        const trimmedText = (text || '').trim();
        const time = new Date();
        const item = { name: trimmedName, text: trimmedText, time: `${time.getHours().toString().padStart(2,'0')}:${time.getMinutes().toString().padStart(2,'0')}`, timestamp: time.getTime() };
        this.timelineItems.push(item);
        this.utterances.push({ name: trimmedName, text: trimmedText });
        this.renderTimelineItem(item);
        this.scrollToBottom();
    }
    
    renderTimelineItem(item) {
        const itemElement = document.createElement('div');
        const colorIndex = this.getColorIndexForName(item.name);
        itemElement.className = `timeline-item speaker-color-${colorIndex}`;
        
        itemElement.innerHTML = `
            <div class="timeline-item-content">
                <div class="timeline-item-speaker">話者：${this.escapeHtml(item.name)}</div>
                <div class="timeline-item-text">内容：${this.escapeHtml(item.text)}</div>
            </div>
            <div class="timeline-item-time">${item.time}</div>
        `;
        
        this.timelineContent.appendChild(itemElement);
        
        // アイテムをクリックで編集可能にする
        itemElement.addEventListener('click', () => {
            this.showEditTooltip(itemElement);
        });
    }
    
    showEditTooltip(itemElement) {
        // 既存のツールチップを削除
        const existingTooltip = document.querySelector('.timeline-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }
        
        // 新しいツールチップを作成
        const tooltip = document.createElement('div');
        tooltip.className = 'timeline-tooltip show';
        tooltip.textContent = 'タイムラインをいじれる';
        
        itemElement.appendChild(tooltip);
        
        // 2秒後に自動的に削除
        setTimeout(() => {
            tooltip.classList.remove('show');
            setTimeout(() => {
                tooltip.remove();
            }, 300);
        }, 2000);
    }
    
    scrollToBottom() {
        if (this.timelineContent) {
            this.timelineContent.scrollTop = this.timelineContent.scrollHeight;
        }
    }
    
    clearTimeline() {
        if (this.timelineContent) {
            this.timelineContent.innerHTML = '';
            this.timelineItems = [];
            this.logger.info('TimelineManager', 'タイムラインをクリア');
        }
    }
    
    getCurrentSpeaker() {
        return this.currentSpeaker;
    }
    
    setSpeaker(speaker) {
        if (speaker === 'A' || speaker === 'B') {
            this.currentSpeaker = speaker;
            this.logger.info('TimelineManager', '話者を変更', { speaker });
        }
    }
    
    // デモ用のアイテムを追加
    addDemoItems() {
        const demoItems = [
            { name: '田中', text: '会議を始めます', time: '12:00' },
            { name: '佐藤', text: 'よろしくお願いします', time: '12:03' },
            { name: '田中', text: '今日の議題について', time: '12:04' },
            { name: '佐藤', text: '承知しました', time: '12:06' }
        ];
        
        demoItems.forEach(item => {
            const itemElement = document.createElement('div');
            const colorIndex = this.getColorIndexForName(item.name);
            itemElement.className = `timeline-item speaker-color-${colorIndex}`;
            
            itemElement.innerHTML = `
                <div class="timeline-item-content">
                    <div class="timeline-item-speaker">話者：${this.escapeHtml(item.name)}</div>
                    <div class="timeline-item-text">内容：${this.escapeHtml(item.text)}</div>
                </div>
                <div class="timeline-item-time">${item.time}</div>
            `;
            
            this.timelineContent.appendChild(itemElement);
            
            // アイテムをクリックで編集可能にする
            itemElement.addEventListener('click', () => {
                this.showEditTooltip(itemElement);
            });
        });
        
        this.logger.info('TimelineManager', 'デモアイテムを追加');
    }
    
    // タイムラインアイテムを取得
    getTimelineItems() {
        return this.timelineItems;
    }
    
    // タイムラインをJSON形式でエクスポート
    exportTimeline() {
        return JSON.stringify(this.timelineItems, null, 2);
    }
    
    // タイムラインをJSON形式でインポート
    importTimeline(jsonString) {
        try {
            const items = JSON.parse(jsonString);
            this.clearTimeline();
            
            items.forEach(item => {
                this.renderTimelineItem(item);
            });
            
            this.timelineItems = items;
            this.logger.info('TimelineManager', 'タイムラインをインポート', { count: items.length });
            return true;
        } catch (error) {
            this.logger.error('TimelineManager', 'タイムラインのインポートに失敗', error);
            return false;
        }
    }

    // HTMLエスケープ
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = String(text ?? '');
        return div.innerHTML;
    }

    // 名前を色インデックスにマップ
    getColorIndexForName(name) {
        const key = (name || '').trim();
        if (!this.nameToColorIndex.has(key)) {
            const nextIndex = this.nameToColorIndex.size % this.palette.length;
            this.nameToColorIndex.set(key, nextIndex);
        }
        return this.nameToColorIndex.get(key);
    }

    // 「〜です。」などを除去して名前らしく整形
    normalizeName(raw) {
        const s = (raw || '').trim();
        // 句読点や「です。」を除く簡易処理
        return s.replace(/[。．\.\s]+$/u, '').replace(/です$/u, '').trim();
    }

    // テキストから「○○です」形式の名前を推定
    tryExtractName(text) {
        const t = (text || '').trim();
        // Unicodeプロパティは使わず、互換性の高い文字クラスで日本語名を推定
        // 一〜龯: CJK、ぁ-ん: ひらがな、ァ-ヶ: カタカナ、ｦ-ﾟ: 半角カナ、ー々〆ヵヶ・: 記号、英数
        const m = t.match(/^([一-龯ぁ-んァ-ヶｦ-ﾟー々〆ヵヶ・A-Za-z0-9]+?)です[。．\s]?/u);
        return m && m[1] ? m[1].trim() : '';
    }

    // JSONを取得
    getUtterances() {
        return { utterances: [...this.utterances] };
    }

    exportUtterancesJSON() {
        return JSON.stringify(this.getUtterances(), null, 2);
    }
}

// グローバルスコープに公開
window.TimelineManager = TimelineManager;


