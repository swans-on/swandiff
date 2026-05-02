/**
 * Myers Diff Algorithm Implementation
 */

/**
 * Executes the Myers Diff algorithm.
 * @param {string[]} oldLines 
 * @param {string[]} newLines 
 * @param {boolean} ignoreWS 
 * @returns {Object[]} Array of diff parts
 */
export function myersDiff(oldLines, newLines, ignoreWS = false) {
    const prepare = s => ignoreWS ? s.replace(/\s+/g, '') : s;
    const N = oldLines.length;
    const M = newLines.length;
    const V = { 1: 0 };
    const trace = [];

    for (let d = 0; d <= N + M; d++) {
        trace.push({ ...V });
        for (let k = -d; k <= d; k += 2) {
            let x;
            if (k === -d || (k !== d && V[k - 1] < V[k + 1])) {
                x = V[k + 1];
            } else {
                x = V[k - 1] + 1;
            }
            let y = x - k;
            while (x < N && y < M && prepare(oldLines[x]) === prepare(newLines[y])) {
                x++; y++;
            }
            V[k] = x;
            if (x >= N && y >= M) return backtrack(trace, N, M, oldLines, newLines);
        }
    }
}

function backtrack(trace, N, M, oldLines, newLines) {
    const result = [];
    let x = N, y = M;
    for (let d = trace.length - 1; d >= 0; d--) {
        const V = trace[d];
        const k = x - y;
        let prevK;
        if (k === -d || (k !== d && V[k - 1] < V[k + 1])) {
            prevK = k + 1;
        } else {
            prevK = k - 1;
        }
        const prevX = V[prevK];
        const prevY = prevX - prevK;

        while (x > prevX && y > prevY) {
            result.unshift({ type: 'unchanged', oldLine: oldLines[x - 1], newLine: newLines[y - 1], oldIdx: x, newIdx: y });
            x--; y--;
        }
        if (d > 0) {
            if (x > prevX) {
                result.unshift({ type: 'removed', line: oldLines[x - 1], idx: x });
                x--;
            } else if (y > prevY) {
                result.unshift({ type: 'added', line: newLines[y - 1], idx: y });
                y--;
            }
        }
    }
    return result;
}

/**
 * Character-level diff for intra-line changes.
 */
export function intraLineDiff(oldStr, newStr, escapeFn) {
    const diff = myersDiff(oldStr.split(''), newStr.split(''));
    let oldHtml = '', newHtml = '';
    
    diff.forEach(part => {
        const txt = part.type === 'unchanged' ? part.oldLine : part.line;
        const escaped = escapeFn(txt);
        if (part.type === 'unchanged') {
            oldHtml += escaped;
            newHtml += escaped;
        } else if (part.type === 'removed') {
            oldHtml += `<span class="inner-diff">${escaped}</span>`;
        } else {
            newHtml += `<span class="inner-diff">${escaped}</span>`;
        }
    });
    return { oldHtml, newHtml };
}
