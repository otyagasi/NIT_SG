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
        
        // 読み上げ開始時にボタンの状態を更新
        updateSpeechButtonStates(true);
        
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
        
        utter.onstart = () => {
            console.log('音声読み上げ開始');
        };
        
        utter.onend = () => {
            console.log('音声読み上げ終了');
            updateSpeechButtonStates(false);
            if (callback) callback();
        };
        
        utter.onerror = (event) => {
            console.error('音声読み上げエラー:', event.error);
            updateSpeechButtonStates(false);
        };
        
        window.speechSynthesis.speak(utter);
    }

    // ボタンの状態を更新する関数
    function updateSpeechButtonStates(isSpeaking) {
        if (speakAllButton) {
            speakAllButton.disabled = isSpeaking;
        }
        if (speakNewButton) {
            speakNewButton.disabled = isSpeaking;
        }
        if (speakStopButton) {
            speakStopButton.disabled = !isSpeaking;
        }
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
            if (!newPart.trim()) {
                alert('新しく追加されたテキストがありません。');
                return;
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

    // 停止ボタンのイベントリスナーを追加
    if (speakStopButton) {
        speakStopButton.addEventListener('click', function() {
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
                console.log('音声読み上げを停止しました');
                updateSpeechButtonStates(false);
            }
        });
        // 初期状態では停止ボタンを無効化
        speakStopButton.disabled = true;
    }
    
    // 初期化時にボタンの状態を設定
    updateSpeechButtonStates(false);
});