/**
 * Application State Management
 */

export const state = {
    showLineNumbers: true,
    wordWrap: false,
    highlightDiff: true,
    unifiedView: false,
    ignoreWhitespace: false,
    showMinimap: true,
    darkMode: false,
    syntaxHighlighting: false,
    language: 'javascript',
    comparing: false
};

const listeners = [];

export function subscribe(callback) {
    listeners.push(callback);
}

export function updateState(newState) {
    Object.assign(state, newState);
    listeners.forEach(cb => cb(state));
}
