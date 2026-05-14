let mediaRecorder = null;
let audioChunks = [];
let stream = null;

export async function startRecording() {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const preferred = 'audio/webm;codecs=opus';
    const mimeType = MediaRecorder.isTypeSupported(preferred) ? preferred : 'audio/webm';
    mediaRecorder = new MediaRecorder(stream, { mimeType });
    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.push(event.data);
    };

    mediaRecorder.start(200);
}

export function stopRecording() {
    return new Promise((resolve, reject) => {
        if (!mediaRecorder || mediaRecorder.state === 'inactive') {
            reject(new Error('No active recording'));
            return;
        }

        mediaRecorder.onstop = () => {
            const blob = new Blob(audioChunks, { type: 'audio/webm' });
            if (stream) stream.getTracks().forEach((track) => track.stop());
            if (blob.size < 500) {
                reject(new Error('empty_recording'));
                return;
            }
            resolve(blob);
        };

        mediaRecorder.stop();
    });
}
