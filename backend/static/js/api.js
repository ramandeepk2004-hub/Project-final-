export async function fetchLanguages() {
    const res = await fetch('/languages');
    if (!res.ok) throw new Error('Failed to load languages');
    return res.json();
}

export async function sendAudio(blob, targetLanguage, sourceLanguage) {
    const formData = new FormData();
    formData.append('file', blob);
    formData.append('target_language', targetLanguage);
    formData.append('source_language', sourceLanguage);

    const response = await fetch('/process', { method: 'POST', body: formData });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
}

export async function fetchPhrases() {
    const res = await fetch('/phrases');
    if (!res.ok) throw new Error('Failed to fetch phrases');
    return res.json();
}

export async function savePhrase(payload) {
    const res = await fetch('/phrases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function deletePhrase(id) {
    const res = await fetch(`/phrases/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}
