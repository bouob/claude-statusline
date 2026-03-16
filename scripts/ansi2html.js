#!/usr/bin/env node
/**
 * Convert ANSI terminal output to an HTML file for screenshotting.
 * Usage: node scripts/showcase.js | node scripts/ansi2html.js > showcase.html
 */

import { readFileSync } from 'node:fs';

const input = readFileSync(process.stdin.fd, 'utf-8');

function ansiToHtml(text) {
  let html = '';
  let i = 0;
  let openSpans = 0;

  while (i < text.length) {
    if (text[i] === '\x1b' && text[i + 1] === '[') {
      // Parse ANSI escape sequence
      let j = i + 2;
      while (j < text.length && text[j] !== 'm') j++;
      const codes = text.slice(i + 2, j).split(';').map(Number);
      i = j + 1;

      if (codes[0] === 0) {
        // Reset
        while (openSpans > 0) { html += '</span>'; openSpans--; }
      } else if (codes[0] === 1) {
        html += '<span style="font-weight:bold">';
        openSpans++;
      } else if (codes[0] === 90) {
        html += '<span style="color:#6c7086">';
        openSpans++;
      } else if (codes[0] === 38 && codes[1] === 2) {
        // True color: 38;2;R;G;B
        const r = codes[2] || 0, g = codes[3] || 0, b = codes[4] || 0;
        html += `<span style="color:rgb(${r},${g},${b})">`;
        openSpans++;
      }
    } else if (text[i] === '<') {
      html += '&lt;';
      i++;
    } else if (text[i] === '>') {
      html += '&gt;';
      i++;
    } else if (text[i] === '&') {
      html += '&amp;';
      i++;
    } else if (text[i] === '\n') {
      html += '\n';
      i++;
    } else {
      html += text[i];
      i++;
    }
  }
  while (openSpans > 0) { html += '</span>'; openSpans--; }
  return html;
}

const body = ansiToHtml(input);

console.log(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body {
    margin: 0;
    padding: 24px 32px;
    background: #1e1e2e;
    color: #cdd6f4;
    font-family: 'JetBrainsMono Nerd Font', 'CaskaydiaCove Nerd Font', 'FiraCode Nerd Font', 'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace;
    font-size: 14px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }
  pre {
    margin: 0;
    white-space: pre;
  }
</style>
</head>
<body>
<pre>${body}</pre>
</body>
</html>`);
