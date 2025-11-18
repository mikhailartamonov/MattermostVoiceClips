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
    getMimeType: () => string;
}

/**
 * Detect iOS Safari
 */
export function isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

/**
 * Check if pause/resume is supported
 * iOS Safari does not support pause/resume
 */
export function isPauseResumeSupported(): boolean {
    return typeof MediaRecorder.prototype.pause === 'function' &&
           typeof MediaRecorder.prototype.resume === 'function' &&
           !isIOS(); // iOS Safari doesn't implement pause/resume properly
}

class MediaRecorderWrapper implements AudioRecorder {
    private mediaRecorder: MediaRecorder | null = null;
    private audioChunks: Blob[] = [];
    private stream: MediaStream | null = null;
    private mimeType: string;

    constructor(stream: MediaStream, mimeType: string) {
        this.stream = stream;
        this.mimeType = mimeType;

        const options: MediaRecorderOptions = {
            audioBitsPerSecond: 128000,
        };

        // Only set mimeType if it's not empty
        if (mimeType) {
            options.mimeType = mimeType;
        }

        this.mediaRecorder = new MediaRecorder(stream, options);

        this.mediaRecorder.addEventListener('dataavailable', (event) => {
            if (event.data.size > 0) {
                this.audioChunks.push(event.data);
            }
        });
    }

    getMimeType(): string {
        return this.mediaRecorder?.mimeType || this.mimeType;
    }

    start(): void {
        if (this.mediaRecorder && this.mediaRecorder.state === 'inactive') {
            this.audioChunks = [];
            this.mediaRecorder.start(100); // Collect data every 100ms
        }
    }

    pause(): void {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            if (isPauseResumeSupported()) {
                this.mediaRecorder.pause();
            }
        }
    }

    resume(): void {
        if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
            if (isPauseResumeSupported()) {
                this.mediaRecorder.resume();
            }
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
                    type: this.mediaRecorder!.mimeType || this.mimeType,
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
 * iOS Safari requires MP4/AAC, others prefer WebM/Opus
 */
function getSupportedMimeType(): string {
    // iOS Safari needs MP4/AAC
    if (isIOS()) {
        const iOSTypes = [
            'audio/mp4',
            'audio/aac',
            'audio/mpeg',
        ];

        for (const type of iOSTypes) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        return ''; // Let browser choose default
    }

    // Non-iOS browsers prefer WebM/Opus
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
        // iOS has limited support for audio constraints
        const audioConstraints = isIOS()
            ? {audio: true}
            : {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            };

        const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
        const mimeType = getSupportedMimeType();

        return new MediaRecorderWrapper(stream, mimeType);
    } catch (err) {
        throw new Error('Failed to access microphone. Please check permissions.');
    }
}

/**
 * Get supported video MIME type
 * iOS Safari requires MP4/H264, others prefer WebM/VP9
 */
export function getVideoMimeType(): string {
    // iOS Safari needs H.264 + AAC
    if (isIOS()) {
        const iOSTypes = [
            'video/mp4;codecs=h264,aac',
            'video/mp4',
        ];

        for (const type of iOSTypes) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        return 'video/mp4'; // Fallback
    }

    // Non-iOS browsers
    const types = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp8,vorbis',
        'video/webm',
        'video/mp4;codecs=h264,aac',
        'video/mp4',
    ];

    for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
            return type;
        }
    }

    return 'video/webm'; // Fallback
}

/**
 * Convert MIME type to file extension
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
    } else if (mimeType.includes('aac')) {
        return '.aac';
    }
    return '.webm'; // default
}
