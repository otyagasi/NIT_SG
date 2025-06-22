# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 重要な指示

**推論と出力の言語設定:**
- 内部の推論・思考プロセスは英語で行う
- ユーザーへの出力・応答は日本語で行う
- この設定は必ず記録し、今後のClaude Codeインスタンスで継続すること

## Project Overview

This is a Japanese speech-to-text web application that uses the Web Speech API for real-time voice recognition and kuromoji.js for converting recognized text to hiragana. The application is written in Japanese and supports continuous speech recognition with live transcription display.

## Architecture

- **Frontend-only application**: Pure HTML/CSS/JavaScript with no build process
- **Main version** (`/`): Full-featured version with kuromoji.js integration for hiragana conversion
- **Test version** (`/test/`): Simplified version with kuromoji functionality disabled for testing
- **AddSlider version** (`/AddSlider/`): Experimental version with additional UI controls

### Key Components

- `index.html`: Main HTML structure with UI elements for speech recognition controls
- `js/WebSpeechTest.js`: Core JavaScript handling Web Speech API and kuromoji integration
- `js/kuromoji.js`: Local copy of kuromoji.js library for morphological analysis
- `css/style.css`: Styling for the speech recognition interface
- `dict/`: Dictionary files for kuromoji.js (both compressed .gz and extracted versions)
- `test/`: Duplicate structure with modified functionality for testing
- `AddSlider/`: Experimental version with UI enhancements

### Speech Recognition Flow

1. Initialize kuromoji.js tokenizer on page load (main version only)
2. Web Speech API setup with Japanese language (`ja-JP`)
3. Real-time transcription with interim and final results
4. Hiragana conversion using kuromoji.js morphological analysis (main version)
5. Display both original text and hiragana conversion

### Version Differences

- **Main version**: Full kuromoji.js integration with local dictionary files
- **Test version**: All kuromoji functionality commented out, sets `kuromojiTokenizer = true` as stub
- **AddSlider version**: Similar to test version structure with additional experimental features

## Common Development Tasks

### Testing Locally
- Open `index.html` directly in browser for main version
- Open `test/index.html` for kuromoji-disabled testing
- Use `AddSlider/index.html` for experimental features

### Debugging
- Main version: Check kuromoji initialization status and dictionary loading
- Test version: Simplified debugging without morphological analysis overhead
- Browser console shows detailed kuromoji initialization progress and error messages

## Deployment

Deploy via Git - do not upload directly to Sakura server using WinSCP as noted in README.md (Japanese: "デプロイはGITからやってください。さくらサーバの方に直接Winscpでアップロードしないでください").

## Development Notes

- No build tools or package managers required (package.json only defines kuromoji dependency)
- Dictionary files are included both compressed (dict.gz/) and extracted (dict/) for flexibility
- Test version at `/test/` has kuromoji functionality commented out for debugging
- Speech recognition requires HTTPS in production for microphone access
- Browser compatibility requires Web Speech API support (primarily Chrome/Chromium-based browsers)
- Kuromoji initialization includes 30-second timeout and progress indicators