function esc(text) {
    return String(text || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

export function initIcons() {
    if (window.lucide) window.lucide.createIcons();
}

export function updateStatus(text) {
    const el = document.getElementById('status-text');
    if (el) el.textContent = text;
}

export function updateLivePreview(text) {
    const el = document.getElementById('live-preview');
    if (el) el.textContent = text;
}

export function setRecordState(state) {
    const btn = document.getElementById('record-btn');
    const icon = document.getElementById('mic-icon');
    btn.classList.remove('recording');
    if (state === 'recording') {
        btn.classList.add('recording');
        icon.setAttribute('data-lucide', 'square');
    } else if (state === 'processing') {
        icon.setAttribute('data-lucide', 'loader-2');
    } else {
        icon.setAttribute('data-lucide', 'mic');
    }
    btn.disabled = state === 'processing';
    initIcons();
}

export function showToast(message, isError = false) {
    let wrap = document.querySelector('.toast-container');
    if (!wrap) {
        wrap = document.createElement('div');
        wrap.className = 'toast-container';
        document.body.appendChild(wrap);
    }
    const node = document.createElement('div');
    node.className = 'toast';
    if (isError) node.style.borderLeftColor = '#ff5f76';
    node.textContent = message;
    wrap.appendChild(node);
    setTimeout(() => node.remove(), 2600);
}

export function renderMessages(messages) {
    const container = document.getElementById('chat-container');
    const empty = document.getElementById('empty-state');
    if (!container) return;

    container.innerHTML = '';
    if (!messages.length) {
        if (empty) container.appendChild(empty);
        return;
    }

    messages.forEach((msg, idx) => {
        const row = document.createElement('article');
        row.className = `message-wrapper ${msg.speaker === 'B' ? 'right' : ''}`;
        row.dataset.index = String(idx);

        row.innerHTML = `
            <div class="msg-meta">
                <span>Speaker ${esc(msg.speaker)}</span>
                <span>${esc(msg.source_language.toUpperCase())} -> ${esc(msg.target_language.toUpperCase())}</span>
                <span>${msg.processing_ms} ms</span>
            </div>
            <div class="msg-bubble">${esc(msg.original_text)}</div>
            <div class="msg-bubble translated">${esc(msg.translated_text)}</div>
            <div class="msg-actions">
                <button data-action="play">Play</button>
                <button data-action="copy">Copy</button>
                <button data-action="share">Share</button>
                <button data-action="save">Save Phrase</button>
                <button data-action="download">Download Audio</button>
            </div>
        `;
        container.appendChild(row);
    });

    container.scrollTop = container.scrollHeight;
}

export function renderPhrases(phrases, query = '', category = 'all') {
    const list = document.getElementById('phrase-list');
    if (!list) return;

    const q = query.trim().toLowerCase();
    const filtered = phrases.filter((p) => {
        const inCategory = category === 'all' || p.category === category;
        const inText = !q || `${p.originalText} ${p.translatedText} ${p.languagePair}`.toLowerCase().includes(q);
        return inCategory && inText;
    });

    list.innerHTML = filtered.map((p) => `
        <article class="phrase-item" data-id="${p.id}">
            <small>${esc(p.category)} | ${esc(p.languagePair)} | ${new Date(p.createdAt).toLocaleString()}</small>
            <div>${esc(p.originalText)}</div>
            <div>${esc(p.translatedText)}</div>
            <div class="msg-actions">
                <button data-phrase-action="use">Use Phrase</button>
                <button data-phrase-action="delete">Delete</button>
            </div>
        </article>
    `).join('');
}

export function renderAnalytics(messages) {
    const total = messages.length;
    const langs = new Map();
    let totalMs = 0;

    messages.forEach((m) => {
        totalMs += Number(m.processing_ms || 0);
        const pair = `${m.source_language}->${m.target_language}`;
        langs.set(pair, (langs.get(pair) || 0) + 1);
    });

    document.getElementById('metric-total').textContent = String(total);
    document.getElementById('metric-languages').textContent = String(langs.size);
    document.getElementById('metric-avg').textContent = `${total ? Math.round(totalMs / total) : 0} ms`;

    const breakdown = document.getElementById('language-breakdown');
    breakdown.innerHTML = Array.from(langs.entries()).map(([k, v]) => `<div>${esc(k)}: ${v}</div>`).join('') || '<div>No data yet.</div>';
}
