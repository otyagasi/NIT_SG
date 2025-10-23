// 受け取った { utterances: [{ name, text }, ...] } を右側タイムラインに描画するだけの軽量レンダラ
(function () {
    const nameToColorIndex = new Map();
    const paletteSize = 8; // css の speaker-color-0..7 に対応

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
        return t.replace(re, '');
    }

    function clearTimeline() {
        const container = document.getElementById('timelineContent');
        if (container) container.innerHTML = '';
    }

    function renderUtterances(data) {
        try {
            const container = document.getElementById('timelineContent');
            if (!container) return false;
            clearTimeline();

            const list = (data && Array.isArray(data.utterances)) ? data.utterances : [];
            list.forEach((u) => {
                const name = (u && u.name) ? String(u.name) : '';
                const text = (u && u.text) ? String(u.text) : '';
                const cleaned = stripSelfIntro(name, text);
                const idx = getColorIndex(name);

                const row = document.createElement('div');
                row.className = 'timeline-item ' + 'speaker-color-' + idx;

                const now = new Date();
                const hh = String(now.getHours()).padStart(2, '0');
                const mm = String(now.getMinutes()).padStart(2, '0');

                row.innerHTML = '
            <div class="timeline-item-content">\
                <div class="timeline-item-speaker">話者：' + escapeHtml(name) + '</div>\
                <div class="timeline-item-text">内容：' + escapeHtml(cleaned) + '</div>\
            </div>\
            <div class="timeline-item-time">' + hh + ':' + mm + '</div>';

                container.appendChild(row);
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

    // 公開API
    window.renderUtterances = renderUtterances;
    window.renderUtterancesFromJson = renderUtterancesFromJson;
})();



