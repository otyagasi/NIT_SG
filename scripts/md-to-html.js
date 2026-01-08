#!/usr/bin/env node

/**
 * Markdown to HTML converter with GitHub styling and Mermaid support
 * Usage: node scripts/md-to-html.js
 */

import { marked } from 'marked';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure marked options
marked.setOptions({
  gfm: true,              // GitHub Flavored Markdown
  breaks: false,          // Don't convert \n to <br>
  headerIds: true,        // Add IDs to headers
  mangle: false,          // Don't escape autolinked email addresses
});

// File paths
const rootDir = path.join(__dirname, '..');
const inputFile = path.join(rootDir, 'README.md');
const outputFile = path.join(rootDir, 'README.html');

// Read markdown file
console.log('📖 README.mdを読み込んでいます...');
const markdown = fs.readFileSync(inputFile, 'utf-8');

// Convert to HTML
console.log('🔄 HTMLに変換しています...');
const contentHtml = marked.parse(markdown);

// Create full HTML with GitHub styling and Mermaid support
const htmlTemplate = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>README - AI搭載リアルタイム議事録作成アプリケーション</title>

  <!-- GitHub Markdown CSS -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.1.0/github-markdown.min.css">

  <!-- Syntax Highlighting -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>

  <!-- Mermaid.js for diagram rendering -->
  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
      }
    });
  </script>

  <style>
    body {
      box-sizing: border-box;
      min-width: 200px;
      max-width: 980px;
      margin: 0 auto;
      padding: 45px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';
      background-color: #ffffff;
    }

    .markdown-body {
      box-sizing: border-box;
      min-width: 200px;
    }

    /* Print styles for PDF export */
    @media print {
      body {
        padding: 20mm;
      }

      .no-print {
        display: none;
      }

      /* Prevent page breaks inside code blocks */
      pre, code {
        page-break-inside: avoid;
      }

      /* Prevent page breaks after headers */
      h1, h2, h3, h4, h5, h6 {
        page-break-after: avoid;
      }
    }

    /* Mermaid diagram styling */
    .mermaid {
      text-align: center;
      margin: 20px 0;
    }

    /* Print button styling */
    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 10px 20px;
      background-color: #0969da;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 1px 3px rgba(0,0,0,0.12);
      z-index: 1000;
    }

    .print-button:hover {
      background-color: #0860ca;
    }

    .print-button:active {
      background-color: #0757ba;
    }
  </style>
</head>
<body>
  <!-- Print/PDF export button -->
  <button class="print-button no-print" onclick="window.print()">📄 PDFとして保存</button>

  <!-- Main content -->
  <article class="markdown-body">
${contentHtml}
  </article>

  <!-- Initialize syntax highlighting -->
  <script>
    // Highlight all code blocks
    hljs.highlightAll();
  </script>
</body>
</html>
`;

// Write HTML file
console.log('💾 README.htmlを保存しています...');
fs.writeFileSync(outputFile, htmlTemplate, 'utf-8');

console.log('✅ 完了！');
console.log('');
console.log('📂 生成されたファイル:', outputFile);
console.log('');
console.log('🌐 ブラウザで開くには:');
console.log('   1. README.htmlをブラウザで開く');
console.log('   2. 右上の「PDFとして保存」ボタンをクリック');
console.log('   3. またはブラウザの印刷機能（Ctrl+P）で「PDFに保存」を選択');
console.log('');
