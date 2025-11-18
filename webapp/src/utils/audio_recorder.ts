/**
 * Audio Recorder using MediaRecorder API
 * Works on desktop, web, iOS and Android
 */

interface AudioRecorder {
    start: () => void;
    pause: () => void;
    resume: () => void;
    stop: () => Promise<Blob>;
    cancel: () => void;
}

class MediaRecorderWrapper implements AudioRecorder {
    private mediaRecorder: MediaRecorder | null = null;
    private audioChunks: Blob[] = [];
    private stream: MediaStream | null = null;

    constructor(stream: MediaStream, mimeType: string) {
        this.stream = stream;
        this.mediaRecorder = new MediaRecorder(stream, {
            mimeType,
            audioBitsPerSecond: 128000,
        });

        this.mediaRecorder.addEventListener('dataavailable', (event) => {
            if (event.data.size > 0) {
                this.audioChunks.push(event.data);
            }
        });
    }

    start(): void {
        if (this.mediaRecorder && this.mediaRecorder.state === 'inactive') {
            this.audioChunks = [];
            this.mediaRecorder.start(100); // Collect data every 100ms
        }
    }

    pause(): void {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.pause();
        }
    }

    resume(): void {
        if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
            this.mediaRecorder.resume();
        }
    }

    stop(): Promise<Blob> {
        return new Promise((resolve, reject) => {
            if (!this.mediaRecorder) {
                reject(new Error('MediaRecorder not initialized'));
                return;
            }

            this.mediaRecorder.addEventListener('stop', () => {
                const blob = new Blob(this.audioChunks, {
                    type: this.mediaRecorder!.mimeType,
                });

                // Stop all tracks
                if (this.stream) {
                    this.stream.getTracks().forEach((track) => track.stop());
                }

                resolve(blob);
            });

            if (this.mediaRecorder.state !== 'inactive') {
                this.mediaRecorder.stop();
            } else {
                reject(new Error('MediaRecorder is not active'));
            }
        });
    }

    cancel(): void {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }

        if (this.stream) {
            this.stream.getTracks().forEach((track) => track.stop());
        }

        this.audioChunks = [];
    }
}

/**
 * Get supported audio MIME type
 * Priority: webm > ogg > mp4
 */
function getSupportedMimeType(): string {
    const types = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/mpeg',
    ];

    for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
            return type;
        }
    }

    // Fallback - browser will use default
    return '';
}

/**
 * Check if browser supports audio recording
 */
export function isAudioRecordingSupported(): boolean {
    return !!(
        navigator.mediaDevices &&
        navigator.mediaDevices.getUserMedia &&
        window.MediaRecorder
    );
}

/**
 * Get audio recorder instance
 * This will work on desktop, web, iOS (Safari 14.3+), and Android (Chrome)
 */
export async function getAudioRecorder(): Promise<AudioRecorder> {
    if (!isAudioRecordingSupported()) {
        throw new Error('Audio recording is not supported in this browser');
    }

    try {
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
            },
        });

        const mimeType = getSupportedMimeType();
        console.log('Using MIME type for recording:', mimeType);

        return new MediaRecorderWrapper(stream, mimeType);
    } catch (err) {
        console.error('Error accessing microphone:', err);
        throw new Error('Failed to access microphone. Please check permissions.');
    }
}

/**
 * Convert audio blob to specific format if needed
 * For now, we'll use the native format, but this can be extended
 */
export function getFileExtensionForMimeType(mimeType: string): string {
    if (mimeType.includes('webm')) {
        return '.webm';
    } else if (mimeType.includes('ogg')) {
        return '.ogg';
    } else if (mimeType.includes('mp4')) {
        return '.mp4';
    } else if (mimeType.includes('mpeg')) {
        return '.mp3';
    }
    return '.webm'; // default
}
