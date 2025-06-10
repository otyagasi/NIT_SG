# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Japanese speech-to-text web application that uses the Web Speech API for real-time voice recognition and kuromoji.js for converting recognized text to hiragana. The application is written in Japanese and supports continuous speech recognition with live transcription display.

## Architecture

- **Frontend-only application**: Pure HTML/CSS/JavaScript with no build process
- **Main version** (`/`): Full-featured version with kuromoji.js integration for hiragana conversion
- **Test version** (`/test/`): Simplified version with kuromoji functionality disabled for testing

### Key Components

- `index.html`: Main HTML structure with UI elements for speech recognition controls
- `js/WebSpeechTest.js`: Core JavaScript handling Web Speech API and kuromoji integration
- `css/style.css`: Styling for the speech recognition interface
- `test/`: Duplicate structure with modified functionality for testing

### Speech Recognition Flow

1. Initialize kuromoji.js tokenizer on page load (main version only)
2. Web Speech API setup with Japanese language (`ja-JP`)
3. Real-time transcription with interim and final results
4. Hiragana conversion using kuromoji.js morphological analysis (main version)
5. Display both original text and hiragana conversion

## Deployment

Deploy via Git - do not upload directly to Sakura server using WinSCP as noted in README.md (Japanese: "デプロイはGITからやってください。さくらサーバの方に直接Winscpでアップロードしないでください").

## Development Notes

- No build tools or package managers required
- Uses CDN for kuromoji.js dependency
- Test version at `/test/` has kuromoji functionality commented out for debugging
- Speech recognition requires HTTPS in production for microphone access
- Browser compatibility requires Web Speech API support (primarily Chrome/Chromium-based browsers)