// 読み上げ機能専用スクリプト

window.lastSpokenHiragana = window.lastSpokenHiragana || '';
window.lastSpokenOriginal = window.lastSpokenOriginal || '';

document.addEventListener('DOMContentLoaded', function() {
    const voiceSelect = document.getElementById('voiceSelect');
    const speakAllButton = document.getElementById('speakAllButton');
    const speakNewButton = document.getElementById('speakNewButton');
    const speakStopButton = document.getElementById('speakStopButton');
    const resultTextElement = document.getElementById('resultText');
    const hiraganaTextElement = document.getElementById('hiraganaText');
    const speakModeOriginal = document.getElementById('speakModeOriginal');
    const speakModeHiragana = document.getElementById('speakModeHiragana');

    let availableVoices = [];
    window.lastSpokenHiragana = window.lastSpokenHiragana || '';
    window.lastSpokenOriginal = window.lastSpokenOriginal || '';

    const voiceNicknames = {
        "Microsoft Ayumi - Japanese (Japan)": "あゆみ",
        "Microsoft Haruka - Japanese (Japan)" : "はるか",
        "Microsoft Ichiro - Japanese (Japan)" : "いちろう",
        "Microsoft Sayaka - Japanese (Japan)" : "さやか",
    };

    function populateVoiceList() {
        if (!window.speechSynthesis) return;
        availableVoices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('ja'));
        if (voiceSelect) {
            voiceSelect.innerHTML = '';
            availableVoices.forEach((voice, idx) => {
                let nickname = voiceNicknames[voice.name] || voice.name;
                const option = document.createElement('option');
                option.value = idx;
                option.textContent = `[${nickname}]`;
                voiceSelect.appendChild(option);
            });
        }
    }

    if (voiceSelect) {
        populateVoiceList();
        if (typeof speechSynthesis !== 'undefined') {
            speechSynthesis.onvoiceschanged = populateVoiceList;
        }
    }

    function getSpeakTargetText() {
        if (speakModeOriginal && speakModeOriginal.checked) {
            return resultTextElement.textContent.trim();
        } else {
            return hiraganaTextElement.textContent.trim();
        }
    }

    function speakText(text, callback) {
        if (!text) {
            alert('読み上げるテキストがありません。');
            return;
        }
        const utter = new window.SpeechSynthesisUtterance(text);
        utter.lang = 'ja-JP';
        utter.rate = 1.0;
        utter.pitch = 1.0;
        if (voiceSelect && availableVoices.length > 0) {
            const selectedIdx = voiceSelect.selectedIndex;
            if (selectedIdx >= 0) {
                utter.voice = availableVoices[selectedIdx];
            }
        }
        utter.onend = () => {
            if (callback) callback();
        };
        window.speechSynthesis.speak(utter);
    }

    if (speakAllButton) {
        speakAllButton.addEventListener('click', () => {
            const text = getSpeakTargetText();
            speakText(text, () => {
                window.lastSpokenHiragana = hiraganaTextElement.textContent.trim();
                window.lastSpokenOriginal = resultTextElement.textContent.trim();
            });
        });
    }

    if (speakNewButton) {
        speakNewButton.addEventListener('click', () => {
            let text, lastSpoken, newPart;
            if (speakModeOriginal && speakModeOriginal.checked) {
                text = resultTextElement.textContent.trim();
                lastSpoken = window.lastSpokenOriginal;
            } else {
                text = hiraganaTextElement.textContent.trim();
                lastSpoken = window.lastSpokenHiragana;
            }
            if (text.startsWith(lastSpoken)) {
                newPart = text.slice(lastSpoken.length);
            } else {
                newPart = text;
            }
            speakText(newPart, () => {
                if (speakModeOriginal && speakModeOriginal.checked) {
                    window.lastSpokenOriginal = text;
                } else {
                    window.lastSpokenHiragana = text;
                }
            });
        });
    }

    if (speakStopButton) {
        speakStopButton.addEventListener('click', function() {
            window.speechSynthesis.cancel();
        });
    }
});