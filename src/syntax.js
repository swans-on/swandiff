/**
 * Syntax Highlighting Rules and Logic
 */

export const LANGUAGE_RULES = {
    javascript: [
        { reg: /\/\/.*$/gm, cls: 'syn-comment' },
        { reg: /\/\*[\s\S]*?\*\//gm, cls: 'syn-comment' },
        { reg: /(['"`])(?:(?!\1).|\\\1)*\1/g, cls: 'syn-string' },
        { reg: /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|export|import|from|class|extends|new|this|super|async|await|try|catch|finally|throw|typeof|instanceof|void|delete|in|of)\b/g, cls: 'syn-keyword' },
        { reg: /\b(true|false|null|undefined)\b/g, cls: 'syn-number' },
        { reg: /\b\d+(\.\d+)?\b/g, cls: 'syn-number' },
        { reg: /\b([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\s*\()/g, cls: 'syn-function' }
    ],
    python: [
        { reg: /#.*$/gm, cls: 'syn-comment' },
        { reg: /(['"]{3})[\s\S]*?\1/g, cls: 'syn-comment' },
        { reg: /(['"])(?:(?!\1).|\\\1)*\1/g, cls: 'syn-string' },
        { reg: /\b(def|return|if|else|elif|for|while|break|continue|import|from|as|class|try|catch|except|finally|raise|with|yield|lambda|global|nonlocal|pass|assert|del|in|is|and|or|not)\b/g, cls: 'syn-keyword' },
        { reg: /\b(True|False|None)\b/g, cls: 'syn-number' },
        { reg: /\b\d+(\.\d+)?\b/g, cls: 'syn-number' },
        { reg: /\b([a-zA-Z_][a-zA-Z0-9_]*)(?=\s*\()/g, cls: 'syn-function' }
    ],
    css: [
        { reg: /\/\*[\s\S]*?\*\//gm, cls: 'syn-comment' },
        { reg: /(['"])(?:(?!\1).|\\\1)*\1/g, cls: 'syn-string' },
        { reg: /\b([a-zA-Z-]+)(?=\s*:)/g, cls: 'syn-keyword' },
        { reg: /#([a-fA-F0-9]{3,6})\b/g, cls: 'syn-number' },
        { reg: /\b\d+(px|em|rem|%|vh|vw|s|ms|deg)?\b/g, cls: 'syn-number' }
    ],
    html: [
        { reg: /&lt;!--[\s\S]*?--&gt;/g, cls: 'syn-comment' },
        { reg: /(&lt;\/?[a-z1-6]+)/gi, cls: 'syn-keyword' },
        { reg: /([a-z-]+)(?==(['"]))/gi, cls: 'syn-function' },
        { reg: /(['"])(?:(?!\1).|\\\1)*\1/g, cls: 'syn-string' }
    ],
    generic: [
        { reg: /(['"])(?:(?!\1).|\\\1)*\1/g, cls: 'syn-string' },
        { reg: /\b\d+(\.\d+)?\b/g, cls: 'syn-number' }
    ]
};

export function highlightSyntax(text, lang, enabled, escapeFn) {
    if (!enabled) return escapeFn(text);

    let html = escapeFn(text);
    const langRules = LANGUAGE_RULES[lang] || LANGUAGE_RULES.generic;

    if (lang === 'html') {
        langRules.forEach(rule => {
            html = html.replace(rule.reg, `<span class="${rule.cls}">$1</span>`);
        });
        return html;
    }

    const placeholders = [];
    let i = 0;
    langRules.forEach(rule => {
        html = html.replace(rule.reg, match => {
            const ph = `___PH${i}___`;
            placeholders.push({ ph, content: `<span class="${rule.cls}">${match}</span>` });
            i++;
            return ph;
        });
    });

    placeholders.forEach(ph => {
        html = html.replace(ph.ph, ph.content);
    });

    return html;
}

export function detectLanguage(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const map = {
        'js': 'javascript', 'ts': 'javascript', 'jsx': 'javascript', 'tsx': 'javascript',
        'html': 'html', 'htm': 'html',
        'css': 'css', 'scss': 'css', 'less': 'css',
        'py': 'python', 'pyw': 'python'
    };
    return map[ext] || null;
}
