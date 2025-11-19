// 受け取った { utterances: [{ name, text }, ...] } を右側タイムラインに描画するだけの軽量レンダラ
(function () {
    const nameToColorIndex = new Map();
    const paletteSize = 8; // css の speaker-color-0..7 に対応
    let currentData = null; // 現在のデータを保持

    function getColorIndex(name) {
        const key = String(name || '').trim();
        if (!nameToColorIndex.has(key)) {
            nameToColorIndex.set(key, nameToColorIndex.size % paletteSize);
        }
        return nameToColorIndex.get(key);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = String(text ?? '');
        return div.innerHTML;
    }

    // 先頭の「<name>です。」等の自己紹介を本文から除去
    function stripSelfIntro(name, text) {
        const n = String(name || '').trim();
        let t = String(text || '');
        if (!n) return t;
        const escaped = n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp('^' + escaped + '\\s*です[。．\\.\s]*');
        const cleaned = t.replace(re, '');

        // 削除した結果が空になった場合は元のテキストを返す
        return cleaned.trim() === '' ? t : cleaned;
    }

    function clearTimeline() {
        const container = document.getElementById('timelineContent');
        if (container) container.innerHTML = '';
    }

    // 発言を編集（インライン編集）
    function editUtterance(index, rowElement) {
        if (!currentData || !currentData.utterances || !currentData.utterances[index]) return;

        const utterance = currentData.utterances[index];
        const speakerDiv = rowElement.querySelector('.timeline-item-speaker');
        const textDiv = rowElement.querySelector('.timeline-item-text');
        const editBtn = rowElement.querySelector('.timeline-edit-btn');

        // 既に編集モードの場合は保存して終了
        if (editBtn.textContent === '✓') {
            // 編集内容を取得
            const nameInput = speakerDiv.querySelector('input');
            const textInput = textDiv.querySelector('textarea');

            if (nameInput && textInput) {
                const newName = nameInput.value.trim();
                const newText = textInput.value.trim();

                if (newName && newText) {
                    utterance.name = newName;
                    utterance.text = newText;

                    // タイムラインを再描画
                    renderUtterances(currentData);

                    // 左側のJSONも更新
                    updateJsonDisplay();
                }
            }
            return;
        }

        // 編集モードに切り替え
        const originalName = utterance.name;
        const originalText = utterance.text;

        // 話者名を編集可能に
        speakerDiv.innerHTML = '話者：<input type="text" class="inline-edit-name" value="' + escapeHtml(originalName) + '" />';

        // 発言内容を編集可能に
        textDiv.innerHTML = '内容：<textarea class="inline-edit-text">' + escapeHtml(originalText) + '</textarea>';

        // ボタンを「完了」に変更
        editBtn.textContent = '✓';
        editBtn.title = '完了';

        // 入力フィールドにフォーカス
        const nameInput = speakerDiv.querySelector('input');
        if (nameInput) {
            nameInput.focus();
            nameInput.select();
        }
    }

    // 発言を削除
    function deleteUtterance(index) {
        if (!currentData || !currentData.utterances || !currentData.utterances[index]) return;

        if (confirm('この発言を削除しますか？')) {
            currentData.utterances.splice(index, 1);

            // タイムラインを再描画
            renderUtterances(currentData);

            // 左側のJSONも更新
            updateJsonDisplay();
        }
    }

    // 左側のJSON表示を更新
    function updateJsonDisplay() {
        const speakerJsonElement = document.getElementById('speaker-json-result');
        if (speakerJsonElement && currentData) {
            speakerJsonElement.textContent = JSON.stringify(currentData, null, 2);
        }
    }

    function renderUtterances(data) {
        try {
            const container = document.getElementById('timelineContent');
            if (!container) return false;
            clearTimeline();

            // 現在のデータを保存
            currentData = data;

            const list = (data && Array.isArray(data.utterances)) ? data.utterances : [];

            // 各話者の初出現を追跡
            const speakerFirstAppearance = new Set();

            list.forEach((u, index) => {
                const name = (u && u.name) ? String(u.name) : '';
                const text = (u && u.text) ? String(u.text) : '';

                // この話者が初めて登場する場合は自己紹介を残す
                const isFirstAppearance = !speakerFirstAppearance.has(name);
                if (name) speakerFirstAppearance.add(name);

                // 初出現の場合は自己紹介を残し、2回目以降は削除
                const cleaned = isFirstAppearance ? text : stripSelfIntro(name, text);
                const idx = getColorIndex(name);

                const row = document.createElement('div');
                row.className = 'timeline-item ' + 'speaker-color-' + idx;

                const now = new Date();
                const hh = String(now.getHours()).padStart(2, '0');
                const mm = String(now.getMinutes()).padStart(2, '0');

                row.innerHTML = '' +
            '<div class="timeline-item-content">' +
                '<div class="timeline-item-speaker">話者：' + escapeHtml(name) + '</div>' +
                '<div class="timeline-item-text">内容：' + escapeHtml(cleaned) + '</div>' +
            '</div>' +
            '<div class="timeline-item-time">' + hh + ':' + mm + '</div>' +
            '<div class="timeline-item-actions">' +
                '<button class="timeline-edit-btn" data-index="' + index + '" title="編集">✏️</button>' +
                '<button class="timeline-delete-btn" data-index="' + index + '" title="削除">🗑️</button>' +
            '</div>';

                container.appendChild(row);
            });

            // イベントリスナーを追加
            container.querySelectorAll('.timeline-edit-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.target.getAttribute('data-index'));
                    const rowElement = e.target.closest('.timeline-item');
                    editUtterance(index, rowElement);
                });
            });

            container.querySelectorAll('.timeline-delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.target.getAttribute('data-index'));
                    deleteUtterance(index);
                });
            });

            return true;
        } catch (e) {
            console.error('renderUtterances error', e);
            return false;
        }
    }

    function renderUtterancesFromJson(jsonLike) {
        try {
            const obj = (typeof jsonLike === 'string') ? JSON.parse(jsonLike) : jsonLike;
            return renderUtterances(obj);
        } catch (e) {
            console.error('Invalid JSON for renderUtterancesFromJson', e);
            return false;
        }
    }

    // 話者名の一括変更
    function bulkRenameSpeaker() {
        if (!currentData || !currentData.utterances) {
            alert('データがありません');
            return;
        }

        // ユニークな話者名を取得
        const speakers = [...new Set(currentData.utterances.map(u => u.name))];

        if (speakers.length === 0) {
            alert('話者がいません');
            return;
        }

        // 話者選択のプロンプト
        const speakerList = speakers.map((s, i) => `${i + 1}. ${s}`).join('\n');
        const oldName = prompt('変更する話者名を選択してください:\n' + speakerList + '\n\n話者名を入力:');

        if (!oldName || !speakers.includes(oldName)) {
            if (oldName !== null) alert('有効な話者名を入力してください');
            return;
        }

        const newName = prompt(`「${oldName}」を何に変更しますか？`, oldName);

        if (newName !== null && newName.trim() !== '') {
            // すべての該当する話者名を変更
            currentData.utterances.forEach(u => {
                if (u.name === oldName) {
                    u.name = newName;
                }
            });

            // タイムラインを再描画
            renderUtterances(currentData);

            // 左側のJSONも更新
            updateJsonDisplay();

            alert(`「${oldName}」を「${newName}」に変更しました`);
        }
    }

    // 公開API
    window.renderUtterances = renderUtterances;
    window.renderUtterancesFromJson = renderUtterancesFromJson;
    window.bulkRenameSpeaker = bulkRenameSpeaker;
    window.clearTimeline = clearTimeline;
})();



