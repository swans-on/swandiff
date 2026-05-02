/**
 * UI and Rendering Utilities
 */

export function escapeHtml(text) {
    return text.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

export function drawMinimap(canvas, diffResults, darkMode, isUnified, unifiedPane, leftPane) {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    if (diffResults.length === 0) return;

    const lineCount = diffResults.length;
    const lineHeight = rect.height / lineCount;

    diffResults.forEach((res, i) => {
        if (res.type === 'unchanged') return;
        ctx.fillStyle = res.type === 'added' ? (darkMode ? '#2ea043' : '#2cbe4e') : (darkMode ? '#f85149' : '#cb2431');
        ctx.fillRect(0, i * lineHeight, rect.width, Math.max(lineHeight, 1));
    });

    const pane = isUnified ? unifiedPane : leftPane;
    const viewTop = (pane.scrollTop / (pane.scrollHeight || 1)) * rect.height;
    const viewHeight = (pane.clientHeight / (pane.scrollHeight || 1)) * rect.height;
    ctx.strokeStyle = darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.2)';
    ctx.strokeRect(2, viewTop, rect.width - 4, viewHeight);
}

export function setupScrollSync(left, right, unified, onScroll) {
    const sync = (src, targets) => {
        src.addEventListener('scroll', () => {
            targets.forEach(t => {
                t.scrollTop = src.scrollTop;
                t.scrollLeft = src.scrollLeft;
            });
            onScroll();
        });
    };
    sync(left, [right]);
    sync(right, [left]);
    unified.addEventListener('scroll', onScroll);
}

export function createLineElement(type, html, idx) {
    const line = document.createElement('div');
    line.className = `diff-line ${type}`;
    line.innerHTML = `<div class="diff-line-content">${html || ' '}</div>`;
    
    const num = document.createElement('div');
    num.textContent = idx || '';
    
    return { line, num };
}

/**
 * Escapes special regex characters in a string.
 */
export function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
