/**
 * Swandiff - Web Diff Viewer
 */

import { state, subscribe, updateState } from './src/state.js';
import { myersDiff, intraLineDiff } from './src/diff.js';
import { highlightSyntax, detectLanguage } from './src/syntax.js';
import { saveSettings, loadSettings } from './src/persistence.js';
import { escapeHtml, drawMinimap, setupScrollSync, createLineElement, escapeRegExp } from './src/ui.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const elements = {
        leftInput: document.getElementById('left-input'),
        rightInput: document.getElementById('right-input'),
        leftDiff: document.getElementById('left-diff'),
        rightDiff: document.getElementById('right-diff'),
        unifiedDiff: document.getElementById('unified-diff'),
        leftLineNumbers: document.querySelector('#left-pane .line-numbers'),
        rightLineNumbers: document.querySelector('#right-pane .line-numbers'),
        unifiedLineNumbers: document.querySelector('.line-numbers-unified'),
        sideBySideContainer: document.getElementById('side-by-side-container'),
        unifiedContainer: document.getElementById('unified-container'),
        compareBtn: document.getElementById('compare-btn'),
        appContainer: document.getElementById('app-container'),
        minimapCanvas: document.getElementById('minimap-canvas'),
        diffStats: document.getElementById('diff-stats'),
        searchInput: document.getElementById('search-input'),
        searchNext: document.getElementById('search-next'),
        searchPrev: document.getElementById('search-prev'),
        // Checkboxes
        showLineNumbersCb: document.getElementById('show-line-numbers'),
        wordWrapCb: document.getElementById('word-wrap'),
        highlightDiffCb: document.getElementById('highlight-diff'),
        unifiedViewCb: document.getElementById('unified-view'),
        ignoreWhitespaceCb: document.getElementById('ignore-whitespace'),
        showMinimapCb: document.getElementById('show-minimap'),
        darkModeCb: document.getElementById('dark-mode'),
        syntaxHighlightingCb: document.getElementById('syntax-highlighting'),
        languageSelect: document.getElementById('language-select')
    };

    let diffResults = [];
    let changeIndices = [];
    let currentChangeIdx = -1;
    let searchMatches = [];
    let currentSearchIdx = -1;

    // --- State & Persistence ---

    const init = () => {
        const saved = loadSettings();
        if (saved) updateState(saved);
        
        // Sync UI with initial state
        elements.showLineNumbersCb.checked = state.showLineNumbers;
        elements.wordWrapCb.checked = state.wordWrap;
        elements.highlightDiffCb.checked = state.highlightDiff;
        elements.unifiedViewCb.checked = state.unifiedView;
        elements.ignoreWhitespaceCb.checked = state.ignoreWhitespace;
        elements.showMinimapCb.checked = state.showMinimap;
        elements.darkModeCb.checked = state.darkMode;
        elements.syntaxHighlightingCb.checked = state.syntaxHighlighting;
        elements.languageSelect.value = state.language;

        updateUI();
    };

    const updateUI = () => {
        const { appContainer, sideBySideContainer, unifiedContainer } = elements;
        
        appContainer.classList.toggle('show-line-numbers', state.showLineNumbers);
        appContainer.classList.toggle('word-wrap', state.wordWrap);
        appContainer.classList.toggle('highlight-off', !state.highlightDiff);
        appContainer.classList.toggle('show-minimap', state.showMinimap);
        document.body.classList.toggle('dark-mode', state.darkMode);
        
        if (state.comparing) {
            sideBySideContainer.style.display = state.unifiedView ? 'none' : 'flex';
            unifiedContainer.style.display = state.unifiedView ? 'flex' : 'none';
            render();
        } else {
            sideBySideContainer.style.display = 'flex';
            unifiedContainer.style.display = 'none';
        }
        
        drawMinimap(elements.minimapCanvas, diffResults, state.darkMode, state.unifiedView, document.getElementById('unified-pane'), document.getElementById('left-pane'));
        saveSettings(state);
    };

    subscribe(updateUI);

    // --- Core Logic ---

    const render = () => {
        const { leftDiff, rightDiff, unifiedDiff, leftLineNumbers, rightLineNumbers, unifiedLineNumbers, diffStats } = elements;
        
        leftDiff.innerHTML = ''; rightDiff.innerHTML = ''; unifiedDiff.innerHTML = '';
        leftLineNumbers.innerHTML = ''; rightLineNumbers.innerHTML = ''; unifiedLineNumbers.innerHTML = '';
        
        let stats = { add: 0, rem: 0 };
        changeIndices = [];
        
        let i = 0;
        let lineIdx = 0;
        while (i < diffResults.length) {
            const current = diffResults[i];
            const next = diffResults[i + 1];
            changeIndices.push(lineIdx);

            if (current.type === 'removed' && next && next.type === 'added') {
                const { oldHtml, newHtml } = intraLineDiff(current.line, next.line, escapeHtml);
                addDiffLine('removed', oldHtml, current.idx, null);
                addDiffLine('added', newHtml, null, next.idx);
                stats.rem++; stats.add++;
                i += 2; lineIdx += 2;
            } else if (current.type === 'unchanged') {
                addDiffLine('unchanged', highlightSyntax(current.oldLine, state.language, state.syntaxHighlighting, escapeHtml), current.oldIdx, current.newIdx);
                changeIndices.pop();
                i++; lineIdx++;
            } else if (current.type === 'removed') {
                addDiffLine('removed', highlightSyntax(current.line, state.language, state.syntaxHighlighting, escapeHtml), current.idx, null);
                stats.rem++; i++; lineIdx++;
            } else {
                addDiffLine('added', highlightSyntax(current.line, state.language, state.syntaxHighlighting, escapeHtml), null, current.idx);
                stats.add++; i++; lineIdx++;
            }
        }
        diffStats.innerHTML = `<span class="stat-add">+${stats.add}</span><span class="stat-rem">-${stats.rem}</span>`;
    };

    const addDiffLine = (type, html, oldIdx, newIdx) => {
        const { leftDiff, rightDiff, unifiedDiff, leftLineNumbers, rightLineNumbers, unifiedLineNumbers } = elements;

        // Side-by-Side
        const left = createLineElement(type !== 'added' ? type : 'empty', type !== 'added' ? html : ' ', oldIdx);
        leftDiff.appendChild(left.line);
        leftLineNumbers.appendChild(left.num);

        const right = createLineElement(type !== 'removed' ? type : 'empty', type !== 'removed' ? html : ' ', newIdx);
        rightDiff.appendChild(right.line);
        rightLineNumbers.appendChild(right.num);

        // Unified
        const unified = createLineElement(type, html, null);
        unifiedDiff.appendChild(unified.line);

        const uNum = document.createElement('div');
        uNum.innerHTML = `<span class="line-num-old">${oldIdx || ''}</span><span class="line-num-new">${newIdx || ''}</span>`;
        unifiedLineNumbers.appendChild(uNum);
    };

    // --- Event Listeners ---

    const setupListeners = () => {
        const { showLineNumbersCb, wordWrapCb, highlightDiffCb, unifiedViewCb, ignoreWhitespaceCb, showMinimapCb, darkModeCb, syntaxHighlightingCb, languageSelect, compareBtn, leftInput, rightInput, searchInput, searchNext, searchPrev } = elements;

        const handleCheck = (e) => updateState({ [e.target.id.replace(/-([a-z])/g, (_, c) => c.toUpperCase())]: e.target.checked });
        
        [showLineNumbersCb, wordWrapCb, highlightDiffCb, unifiedViewCb, ignoreWhitespaceCb, showMinimapCb, darkModeCb, syntaxHighlightingCb].forEach(cb => {
            cb.addEventListener('change', handleCheck);
        });

        languageSelect.addEventListener('change', (e) => updateState({ language: e.target.value }));

        compareBtn.addEventListener('click', () => {
            if (state.comparing) {
                updateState({ comparing: false });
                elements.compareBtn.textContent = 'Compare';
            } else {
                const oldLines = elements.leftInput.value.split('\n');
                const newLines = elements.rightInput.value.split('\n');
                diffResults = myersDiff(oldLines, newLines, state.ignoreWhitespace);
                updateState({ comparing: true });
                elements.compareBtn.textContent = 'Edit';
            }
        });

        // Search
        searchInput.addEventListener('input', () => {
            const term = searchInput.value.toLowerCase();
            searchMatches = [];
            currentSearchIdx = -1;
            document.querySelectorAll('.search-match').forEach(el => el.outerHTML = el.innerHTML);
            if (!term) return;

            const escapedTerm = escapeRegExp(term);
            const contents = document.querySelectorAll('.diff-view:not([style*="display: none"]) .diff-line-content');
            contents.forEach(el => {
                if (el.textContent.toLowerCase().includes(term)) {
                    searchMatches.push(el);
                    el.innerHTML = el.innerHTML.replace(new RegExp(`(${escapedTerm})`, 'gi'), '<span class="search-match">$1</span>');
                }
            });
            if (searchMatches.length > 0) { currentSearchIdx = 0; jumpToSearch(); }
        });

        const jumpToSearch = () => {
            document.querySelectorAll('.search-match.current').forEach(el => el.classList.remove('current'));
            if (currentSearchIdx >= 0) {
                const match = searchMatches[currentSearchIdx];
                const span = match.querySelector('.search-match');
                if (span) {
                    span.classList.add('current');
                    span.scrollIntoView({ block: 'center', behavior: 'smooth' });
                }
            }
        };

        searchNext.addEventListener('click', () => { if (searchMatches.length) { currentSearchIdx = (currentSearchIdx + 1) % searchMatches.length; jumpToSearch(); } });
        searchPrev.addEventListener('click', () => { if (searchMatches.length) { currentSearchIdx = (currentSearchIdx - 1 + searchMatches.length) % searchMatches.length; jumpToSearch(); } });

        // Drag & Drop
        const setupDD = (el, input) => {
            el.addEventListener('dragover', (e) => { e.preventDefault(); el.classList.add('drag-over'); });
            el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
            el.addEventListener('drop', (e) => {
                e.preventDefault(); el.classList.remove('drag-over');
                const file = e.dataTransfer.files[0];
                if (file) {
                    const lang = detectLanguage(file.name);
                    if (lang) updateState({ language: lang });
                    const reader = new FileReader();
                    reader.onload = (re) => { input.value = re.target.result; updateTextareaLineNumbers(); };
                    reader.readAsText(file);
                }
            });
        };
        setupDD(leftInput, leftInput); setupDD(rightInput, rightInput);

        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
            if (e.key === 'j') {
                if (!changeIndices.length) return;
                currentChangeIdx = (currentChangeIdx + 1) % changeIndices.length;
                const line = document.querySelectorAll('.diff-view:not([style*="display: none"]) .diff-line')[changeIndices[currentChangeIdx]];
                line?.scrollIntoView({ block: 'center', behavior: 'smooth' });
            } else if (e.key === 'k') {
                if (!changeIndices.length) return;
                currentChangeIdx = (currentChangeIdx - 1 + changeIndices.length) % changeIndices.length;
                const line = document.querySelectorAll('.diff-view:not([style*="display: none"]) .diff-line')[changeIndices[currentChangeIdx]];
                line?.scrollIntoView({ block: 'center', behavior: 'smooth' });
            } else if (e.key === 'v') {
                updateState({ unifiedView: !state.unifiedView });
                elements.unifiedViewCb.checked = state.unifiedView;
            } else if (e.key === '/') {
                e.preventDefault(); searchInput.focus();
            }
        });

        // Scrolling
        setupScrollSync(
            document.getElementById('left-pane'),
            document.getElementById('right-pane'),
            document.getElementById('unified-pane'),
            () => drawMinimap(elements.minimapCanvas, diffResults, state.darkMode, state.unifiedView, document.getElementById('unified-pane'), document.getElementById('left-pane'))
        );

        const updateTextareaLineNumbers = () => {
            const lCount = elements.leftInput.value.split('\n').length, rCount = elements.rightInput.value.split('\n').length;
            const max = Math.max(lCount, rCount);
            elements.leftLineNumbers.innerHTML = ''; elements.rightLineNumbers.innerHTML = '';
            for (let i = 1; i <= max; i++) {
                const l = document.createElement('div'); l.textContent = i <= lCount ? i : ''; elements.leftLineNumbers.appendChild(l);
                const r = document.createElement('div'); r.textContent = i <= rCount ? i : ''; elements.rightLineNumbers.appendChild(r);
            }
        };
        leftInput.addEventListener('input', updateTextareaLineNumbers);
        rightInput.addEventListener('input', updateTextareaLineNumbers);
    };

    init();
    setupListeners();
});
