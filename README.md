# Swandiff - Swanson's Web Diff Viewer

A high-performance, fun, and dependency-free web application for comparing text and code.

**[Live Demo](https://swans-on.github.io/swandiff/)**

![Swandiff Logo](logo.svg)

## Features

- **Advanced Diff Engine**: Powered by the **Myers Diff Algorithm** for accurate insertion/deletion detection.
- **Intra-line Highlighting**: Identifies specific character-level changes within modified lines.
- **Side-by-Side & Unified Views**: Toggle between traditional split-pane and interleaved views.
- **Syntax Highlighting**: Built-in support for JavaScript, HTML, CSS, and Python (with a generic fallback).
- **Navigation Minimap**: A visual bird's-eye view of all changes with click-to-jump functionality.
- **Real-time Search**: Search through the diff with instant highlighting and match navigation.
- **Auto-Language Detection**: Automatically detects language from dropped files.
- **Dark Mode**: High-contrast dark theme for long coding sessions.
- **Persistent Settings**: Remembers your preferences across sessions using `localStorage`.

## Keyboard Shortcuts

- `j`: Jump to **Next Change**
- `k`: Jump to **Previous Change**
- `v`: Toggle **Unified/Side-by-Side View**
- `/`: Focus **Search Bar**

## Technical Implementation

### Myers Diff Algorithm
The core comparison logic implements the Myers diff algorithm, which finds the Shortest Edit Script (SES) between two sequences. It operates in $O((N+M)D)$ time and space complexity, where $N$ and $M$ are the lengths of the sequences and $D$ is the size of the minimum edit script.

### Zero Dependencies
This project is built using only vanilla HTML5, CSS3, and modern ES6+ JavaScript. It requires no build steps, no `npm install`, and no external CDNs.

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).
