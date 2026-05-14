import { startRecording, stopRecording } from './recorder.js';
import { sendAudio } from './api.js';
import { initIcons, showToast } from './ui.js';
import { DEFAULT_PHRASES } from './data/phrases.js';

const LANG_STORAGE_KEY = 'ag_selected_languages';
const THEME_STORAGE_KEY = 'ag_theme';
const FAVORITES_KEY = 'ag_phrase_favorites';
const RECENT_KEY = 'ag_recent_phrases';

const THEMES = {
    dark: { label: 'Dark' },
    light: { label: 'Light' },
};

const LANGUAGES = [
    { code: 'auto', name: 'Auto Detect', native: 'Auto', flag: '🌐' },
    { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
    { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
    { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪' },
    { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
    { code: 'zh', name: 'Chinese', native: '中文', flag: '🇨🇳' },
    { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵' },
];

const SCREEN_MAP = {
    chat: { id: 'chat-screen', title: 'Chat' },
    conversation: { id: 'conversation-screen', title: 'Conversation' },
    phrasebook: { id: 'phrasebook-screen', title: 'Phrasebook' },
    analytics: { id: 'analytics-screen', title: 'Analytics' },
    history: { id: 'history-screen', title: 'History' },
    settings: { id: 'settings-screen', title: 'Settings' },
};

const POPULAR_LANGUAGE_CODES = ['auto', 'en', 'hi', 'es', 'fr', 'de'];
const INDIAN_LANGUAGE_CODES = ['hi', 'pa'];

let selectedPhraseCategory = 'General';
let phraseSearchQuery = '';
let favoritePhrases = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');

const state = {
    currentView: 'chat',
    modalRole: 'source',
    theme: localStorage.getItem(THEME_STORAGE_KEY) || 'dark',
    sourceLanguage: 'auto',
    targetLanguage: 'en',
    recording: { active: false, speaker: null },
    liveTimer: null,
    chatMessages: JSON.parse(localStorage.getItem('history_single') || '[]'),
    conversationMessages: JSON.parse(localStorage.getItem('history_conversation') || '[]'),
    recentPhraseIds: JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'),
};

function debounce(fn, delay = 200) {
    let timer = null;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

function getLang(code) {
    return LANGUAGES.find((lang) => lang.code === code) || { code, name: code.toUpperCase(), native: code.toUpperCase(), flag: '🌐' };
}

function loadLanguagePrefs() {
    try {
        const parsed = JSON.parse(localStorage.getItem(LANG_STORAGE_KEY) || '{}');
        if (parsed.sourceLanguage) state.sourceLanguage = parsed.sourceLanguage;
        if (parsed.targetLanguage) state.targetLanguage = parsed.targetLanguage;
    } catch {}
}

function persistLanguagePrefs() {
    localStorage.setItem(LANG_STORAGE_KEY, JSON.stringify({
        sourceLanguage: state.sourceLanguage,
        targetLanguage: state.targetLanguage,
    }));
}

function setTheme(theme) {
    state.theme = THEMES[theme] ? theme : 'dark';
    document.body.classList.toggle('light', state.theme === 'light');
    localStorage.setItem(THEME_STORAGE_KEY, state.theme);
    const toggle = document.getElementById('theme-toggle-btn');
    if (toggle) {
        toggle.innerHTML = state.theme === 'light' ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
    }
    initIcons();
}

function updateLanguageButtons() {
    const source = getLang(state.sourceLanguage);
    const target = getLang(state.targetLanguage);
    document.getElementById('source-language-btn').textContent = `${source.flag} ${source.name}`;
    document.getElementById('target-language-btn').textContent = `${target.flag} ${target.name}`;
}

function switchScreen(view) {
    state.currentView = view;
    Object.entries(SCREEN_MAP).forEach(([key, screen]) => {
        document.getElementById(screen.id).classList.toggle('hidden', key !== view);
    });
    document.getElementById('screen-title').textContent = SCREEN_MAP[view].title;
    document.querySelectorAll('.sidebar-item').forEach((item) => {
        item.classList.toggle('active', item.dataset.view === view);
    });
    if (window.innerWidth <= 1100) {
        document.body.classList.remove('sidebar-open');
    }
}

function openLanguageModal(role) {
    state.modalRole = role;
    document.getElementById('language-modal-title').textContent = role === 'source' ? 'Select input language' : 'Select output language';
    document.getElementById('language-search').value = '';
    renderLanguageOptions(LANGUAGES);
    document.getElementById('language-modal').classList.remove('hidden');
}

function closeLanguageModal() {
    document.getElementById('language-modal').classList.add('hidden');
}

function filterLanguages(query) {
    const normalized = query.trim().toLowerCase();
    return LANGUAGES.filter((lang) =>
        lang.name.toLowerCase().includes(normalized) ||
        lang.native.toLowerCase().includes(normalized)
    );
}

function renderLanguageOptions(list) {
    const active = state.modalRole === 'source' ? state.sourceLanguage : state.targetLanguage;
    const allowed = list.filter((lang) => !(state.modalRole === 'target' && lang.code === 'auto'));

    const buttonMarkup = (lang) => `
        <button class="lang-item ${lang.code === active ? 'active' : ''}" data-lang-code="${lang.code}">
            ${lang.flag} ${lang.name}<span class="native">${lang.native}</span>
        </button>
    `;

    document.getElementById('popular-languages').innerHTML = allowed
        .filter((lang) => POPULAR_LANGUAGE_CODES.includes(lang.code))
        .map(buttonMarkup)
        .join('');

    document.getElementById('indian-languages').innerHTML = allowed
        .filter((lang) => INDIAN_LANGUAGE_CODES.includes(lang.code))
        .map(buttonMarkup)
        .join('');

    document.getElementById('all-languages').innerHTML = allowed.map(buttonMarkup).join('');
}

function swapLanguages() {
    if (state.sourceLanguage === 'auto') return;
    [state.sourceLanguage, state.targetLanguage] = [state.targetLanguage, state.sourceLanguage];
    updateLanguageButtons();
    persistLanguagePrefs();
    renderPhrasebook();
}

function languageBadgeText() {
    const sourceCode = state.sourceLanguage === 'auto' ? 'en' : state.sourceLanguage;
    return `${sourceCode.toUpperCase()} -> ${state.targetLanguage.toUpperCase()}`;
}

function phraseTranslatedText(phrase) {
    return phrase.translations[state.targetLanguage] || phrase.sourceText;
}

function renderCategoryPills() {
    const categories = ['All', 'General', 'Travel', 'Emergency', 'Medical', 'Food', 'Shopping', 'Business', 'Hotel', 'Transportation'];
    document.getElementById('phrase-categories').innerHTML = categories
        .map((category) => `<button data-cat="${category}" class="sidebar-item ${category === selectedPhraseCategory ? 'active' : ''}"><span>${category}</span></button>`)
        .join('');
}

function renderRecentPhrases() {
    const recent = state.recentPhraseIds
        .map((id) => DEFAULT_PHRASES.find((phrase) => phrase.id === id))
        .filter(Boolean)
        .slice(0, 8);

    const root = document.getElementById('recently-used-phrases');
    if (!recent.length) {
        root.innerHTML = '<div class="status-text">No recent phrases yet.</div>';
        return;
    }

    root.innerHTML = recent
        .map((phrase) => `<button class="lang-item" data-recent-id="${phrase.id}">${phrase.sourceText}</button>`)
        .join('');
}

function renderPhrasebook() {
    const root = document.getElementById('phrasebook-list');
    root.innerHTML = '';

    const filtered = DEFAULT_PHRASES.filter((phrase) => {
        const matchesCategory =
            selectedPhraseCategory === 'All' ||
            phrase.category === selectedPhraseCategory;

        const translatedText =
            phrase.translations[state.targetLanguage] || '';

        const matchesSearch =
            phrase.sourceText.toLowerCase().includes(phraseSearchQuery.toLowerCase()) ||
            translatedText.toLowerCase().includes(phraseSearchQuery.toLowerCase());

        return matchesCategory && matchesSearch;
    });

    filtered.forEach((phrase) => {
        const translatedText = phraseTranslatedText(phrase);
        const isFavorite = favoritePhrases.includes(phrase.id);
        const card = document.createElement('article');
        card.className = 'phrase-item';
        card.dataset.phraseId = phrase.id;
        card.innerHTML = `
            <div class="msg-meta">
                <span class="cat-badge">${phrase.category}</span>
                <span>${languageBadgeText()}</span>
            </div>
            <div class="phrase-original">${phrase.sourceText}</div>
            <div class="phrase-translated">${translatedText}</div>
            <div class="msg-actions">
                <button data-action="play">Play</button>
                <button data-action="copy">Copy</button>
                <button data-action="fav">${isFavorite ? 'Favorited' : 'Favorite'}</button>
            </div>
        `;
        root.appendChild(card);
    });
}

function markPhraseUsed(phraseId) {
    state.recentPhraseIds = [phraseId, ...state.recentPhraseIds.filter((id) => id !== phraseId)].slice(0, 20);
    localStorage.setItem(RECENT_KEY, JSON.stringify(state.recentPhraseIds));
    renderRecentPhrases();
}

function setDetectedBadge(elementId, languageCode) {
    const element = document.getElementById(elementId);
    if (state.sourceLanguage !== 'auto' || !languageCode || languageCode === 'auto') {
        element.classList.add('hidden');
        return;
    }
    const lang = getLang(languageCode);
    element.textContent = `Detected: ${lang.name} ${lang.flag}`;
    element.classList.remove('hidden');
}

function renderChatMessages() {
    const root = document.getElementById('chat-messages');
    root.innerHTML = state.chatMessages.map((message) => `
        <article class="message-wrapper">
            <div class="msg-meta">
                <span>${message.source_language.toUpperCase()} -> ${message.target_language.toUpperCase()}</span>
                <span>${message.processing_ms || 0} ms</span>
            </div>
            <div class="msg-bubble">${message.original_text}</div>
            <div class="msg-bubble translated">${message.translated_text}</div>
        </article>
    `).join('');
    root.scrollTop = root.scrollHeight;
}

function renderConversationMessages() {
    const aMessages = state.conversationMessages.filter((message) => message.speaker === 'A');
    const bMessages = state.conversationMessages.filter((message) => message.speaker === 'B');

    const aRoot = document.getElementById('panel-a-messages');
    const bRoot = document.getElementById('panel-b-messages');

    aRoot.innerHTML = aMessages.length ? aMessages.map((message) => `
        <article class="message-wrapper">
            <div class="msg-meta">
                <span>${message.source_language.toUpperCase()} -> ${message.target_language.toUpperCase()}</span>
            </div>
            <div class="msg-bubble">${message.original_text}</div>
            <div class="msg-bubble translated">${message.translated_text}</div>
        </article>
    `).join('') : '<article class="history-item"><p>Speaker A messages will appear here.</p></article>';

    bRoot.innerHTML = bMessages.length ? bMessages.map((message) => `
        <article class="message-wrapper row-right">
            <div class="msg-meta">
                <span>${message.source_language.toUpperCase()} -> ${message.target_language.toUpperCase()}</span>
            </div>
            <div class="msg-bubble">${message.original_text}</div>
            <div class="msg-bubble translated">${message.translated_text}</div>
        </article>
    `).join('') : '<article class="history-item"><p>Speaker B messages will appear here.</p></article>';

    aRoot.scrollTop = aRoot.scrollHeight;
    bRoot.scrollTop = bRoot.scrollHeight;
}

function renderAnalytics() {
    const allMessages = [...state.chatMessages, ...state.conversationMessages];
    const languagePairs = new Set(allMessages.map((message) => `${message.source_language}->${message.target_language}`));
    const averageMs = allMessages.length
        ? Math.round(allMessages.reduce((sum, message) => sum + Number(message.processing_ms || 0), 0) / allMessages.length)
        : 0;

    document.getElementById('analytics-body').innerHTML = `
        <article class="analytics-card">
            <span class="status-text">Total translations</span>
            <strong>${allMessages.length}</strong>
        </article>
        <article class="analytics-card">
            <span class="status-text">Language pairs used</span>
            <strong>${languagePairs.size}</strong>
        </article>
        <article class="analytics-card">
            <span class="status-text">Average processing time</span>
            <strong>${averageMs} ms</strong>
        </article>
    `;
}

function renderHistory() {
    const merged = [
        ...state.chatMessages.map((message) => ({ ...message, mode: 'Chat' })),
        ...state.conversationMessages.map((message) => ({ ...message, mode: `Conversation ${message.speaker}` })),
    ].reverse();

    const root = document.getElementById('history-list');
    if (!merged.length) {
        root.innerHTML = '<article class="history-item"><p>No translation history yet.</p></article>';
        return;
    }

    root.innerHTML = merged.map((message) => `
        <article class="history-item">
            <div class="msg-meta">
                <span>${message.mode}</span>
                <span>${message.source_language.toUpperCase()} -> ${message.target_language.toUpperCase()}</span>
            </div>
            <p>${message.original_text}</p>
            <p>${message.translated_text}</p>
        </article>
    `).join('');
}

function updateStatus(statusId, liveId, text, live = '') {
    document.getElementById(statusId).textContent = text;
    document.getElementById(liveId).textContent = live;
}

function beginLive(statusId, liveId) {
    const phases = ['Listening', 'Listening.', 'Listening..', 'Listening...'];
    let index = 0;
    state.liveTimer = setInterval(() => {
        updateStatus(statusId, liveId, 'Listening...', phases[index % phases.length]);
        index += 1;
    }, 420);
}

function endLive(statusId, liveId) {
    if (state.liveTimer) clearInterval(state.liveTimer);
    state.liveTimer = null;
    updateStatus(statusId, liveId, 'Tap to speak', '');
}

async function toggleRecording(buttonId, speaker, sourceLanguage, targetLanguage, statusId, liveId, mode, detectedId) {
    const button = document.getElementById(buttonId);

    if (!state.recording.active) {
        try {
            await startRecording();
            state.recording = { active: true, speaker };
            button.classList.add('recording');
            beginLive(statusId, liveId);
        } catch {
            showToast('Microphone unavailable', true);
        }
        return;
    }

    if (state.recording.speaker !== speaker) return;

    button.classList.remove('recording');
    state.recording = { active: false, speaker: null };

    try {
        updateStatus(statusId, liveId, 'Translating...', '');
        const blob = await stopRecording();
        const result = await sendAudio(blob, targetLanguage, sourceLanguage);
        const message = { ...result, speaker };

        if (mode === 'chat') {
            state.chatMessages.push(message);
            localStorage.setItem('history_single', JSON.stringify(state.chatMessages));
        } else {
            state.conversationMessages.push(message);
            localStorage.setItem('history_conversation', JSON.stringify(state.conversationMessages));
        }

        setDetectedBadge(detectedId, result.source_language);
        renderChatMessages();
        renderConversationMessages();
        renderAnalytics();
        renderHistory();
        endLive(statusId, liveId);
    } catch (error) {
        endLive(statusId, liveId);
        showToast(error.message === 'empty_recording' ? 'Audio too short' : 'Translation failed', true);
    }
}

function bindEvents() {
    document.getElementById('sidebar-toggle').addEventListener('click', () => {
        document.body.classList.toggle('sidebar-open');
    });

    document.getElementById('sidebar-nav').addEventListener('click', (event) => {
        const button = event.target.closest('[data-view]');
        if (!button) return;
        switchScreen(button.dataset.view);
    });

    document.getElementById('source-language-btn').addEventListener('click', () => openLanguageModal('source'));
    document.getElementById('target-language-btn').addEventListener('click', () => openLanguageModal('target'));
    document.getElementById('swap-language-btn').addEventListener('click', swapLanguages);

    document.getElementById('theme-toggle-btn').addEventListener('click', () => {
        setTheme(state.theme === 'dark' ? 'light' : 'dark');
    });

    document.getElementById('settings-screen').addEventListener('click', (event) => {
        const tile = event.target.closest('[data-theme-choice]');
        if (!tile) return;
        setTheme(tile.dataset.themeChoice);
    });

    document.getElementById('language-modal-close').addEventListener('click', closeLanguageModal);
    document.getElementById('language-modal').addEventListener('click', (event) => {
        if (event.target.id === 'language-modal') closeLanguageModal();
    });

    document.getElementById('language-search').addEventListener('input', debounce((event) => {
        renderLanguageOptions(filterLanguages(event.target.value));
    }, 180));

    document.getElementById('language-sections').addEventListener('click', (event) => {
        const button = event.target.closest('[data-lang-code]');
        if (!button) return;
        const code = button.dataset.langCode;
        if (state.modalRole === 'source') {
            state.sourceLanguage = code;
        } else {
            state.targetLanguage = code;
        }
        persistLanguagePrefs();
        updateLanguageButtons();
        closeLanguageModal();
        renderPhrasebook();
    });

    document.getElementById('phrase-categories').addEventListener('click', (event) => {
        const button = event.target.closest('[data-cat]');
        if (!button) return;
        selectedPhraseCategory = button.dataset.cat;
        renderCategoryPills();
        renderPhrasebook();
    });

    document.getElementById('phrase-search').addEventListener('input', debounce((event) => {
        phraseSearchQuery = event.target.value;
        renderPhrasebook();
    }, 200));

    document.getElementById('phrasebook-list').addEventListener('click', async (event) => {
        const card = event.target.closest('.phrase-item');
        if (!card) return;

        const phrase = DEFAULT_PHRASES.find((item) => item.id === card.dataset.phraseId);
        if (!phrase) return;

        const translatedText = phraseTranslatedText(phrase);
        const action = event.target.dataset.action;

        if (action === 'play') {
            const utterance = new SpeechSynthesisUtterance(translatedText);
            utterance.lang = state.targetLanguage;
            speechSynthesis.speak(utterance);
            markPhraseUsed(phrase.id);
        }

        if (action === 'copy') {
            await navigator.clipboard.writeText(translatedText);
            showToast('Copied phrase');
            markPhraseUsed(phrase.id);
        }

        if (action === 'fav') {
            if (favoritePhrases.includes(phrase.id)) {
                favoritePhrases = favoritePhrases.filter((id) => id !== phrase.id);
            } else {
                favoritePhrases = [...favoritePhrases, phrase.id];
            }
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoritePhrases));
            renderPhrasebook();
        }
    });

    document.getElementById('recently-used-phrases').addEventListener('click', (event) => {
        const button = event.target.closest('[data-recent-id]');
        if (!button) return;
        const phrase = DEFAULT_PHRASES.find((item) => item.id === button.dataset.recentId);
        if (!phrase) return;
        const utterance = new SpeechSynthesisUtterance(phraseTranslatedText(phrase));
        utterance.lang = state.targetLanguage;
        speechSynthesis.speak(utterance);
    });

    document.getElementById('chat-mic').addEventListener('click', () => {
        toggleRecording('chat-mic', 'A', state.sourceLanguage, state.targetLanguage, 'chat-status', 'chat-live', 'chat', 'chat-detected');
    });

    document.getElementById('mic-A').addEventListener('click', () => {
        toggleRecording('mic-A', 'A', state.sourceLanguage, state.targetLanguage, 'status-A', 'live-A', 'conversation', 'detected-A');
    });

    document.getElementById('mic-B').addEventListener('click', () => {
        toggleRecording('mic-B', 'B', state.targetLanguage, state.sourceLanguage, 'status-B', 'live-B', 'conversation', 'detected-B');
    });
}

function boot() {
    loadLanguagePrefs();
    setTheme(state.theme);
    updateLanguageButtons();
    renderCategoryPills();
    renderRecentPhrases();
    renderPhrasebook();
    renderChatMessages();
    renderConversationMessages();
    renderAnalytics();
    renderHistory();
    switchScreen('chat');
    bindEvents();
    initIcons();
}

boot();
