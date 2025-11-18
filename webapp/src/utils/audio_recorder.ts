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
 * Detect Firefox browser
 */
export function isFirefox(): boolean {
    return navigator.userAgent.toLowerCase().includes('firefox');
}

/**
 * Check if pause/resume is supported
 * iOS Safari does not support pause/resume
 */
export function isPauseResumeSupported(): boolean {
    // First check if MediaRecorder exists
    if (typeof window === 'undefined' || !window.MediaRecorder) {
        return false;
    }

    // Check if pause/resume methods exist
    if (typeof MediaRecorder.prototype.pause !== 'function' ||
        typeof MediaRecorder.prototype.resume !== 'function') {
        return false;
    }

    // iOS Safari doesn't implement pause/resume properly
    if (isIOS()) {
        return false;
    }

    return true;
}

class MediaRecorderWrapper implements AudioRecorder {
    private mediaRecorder: MediaRecorder | null = null;
    private audioChunks: Blob[] = [];
    private stream: MediaStream | null = null;
    private mimeType: string;

    constructor(stream: MediaStream, mimeType: string, audioBitrate: number = 128000) {
        this.stream = stream;
        this.mimeType = mimeType;

        const options: MediaRecorderOptions = {
            audioBitsPerSecond: audioBitrate,
        };

        // Only set mimeType if it's not empty and supported
        if (mimeType && MediaRecorder.isTypeSupported(mimeType)) {
            options.mimeType = mimeType;
        }

        try {
            this.mediaRecorder = new MediaRecorder(stream, options);
        } catch (err) {
            // If mimeType is not supported, try without it
            this.mediaRecorder = new MediaRecorder(stream, {
                audioBitsPerSecond: audioBitrate,
            });
        }

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
                try {
                    this.mediaRecorder.pause();
                } catch (err) {
                    // Pause not supported, ignore
                }
            }
        }
    }

    resume(): void {
        if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
            if (isPauseResumeSupported()) {
                try {
                    this.mediaRecorder.resume();
                } catch (err) {
                    // Resume not supported, ignore
                }
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
                    type: this.mediaRecorder!.mimeType || this.mimeType || 'audio/webm',
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
 * iOS Safari requires MP4/AAC, Firefox prefers OGG, others prefer WebM/Opus
 */
function getSupportedMimeType(): string {
    // Check if MediaRecorder exists
    if (typeof window === 'undefined' || !window.MediaRecorder) {
        return '';
    }

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

    // Firefox (especially on Linux) works better with OGG/Opus
    if (isFirefox()) {
        const firefoxTypes = [
            'audio/ogg;codecs=opus',
            'audio/ogg',
            'audio/webm;codecs=opus',
            'audio/webm',
        ];

        for (const type of firefoxTypes) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
    }

    // Chrome/Edge and other browsers prefer WebM/Opus
    const types = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/ogg',
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
        typeof window !== 'undefined' &&
        navigator.mediaDevices &&
        navigator.mediaDevices.getUserMedia &&
        window.MediaRecorder
    );
}

/**
 * Get audio recorder instance
 * This will work on desktop, web, iOS (Safari 14.3+), and Android (Chrome)
 * @param audioBitrate - Audio bitrate in bps (default: 128000)
 */
export async function getAudioRecorder(audioBitrate: number = 128000): Promise<AudioRecorder> {
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

        return new MediaRecorderWrapper(stream, mimeType, audioBitrate);
    } catch (err) {
        throw new Error('Failed to access microphone. Please check permissions.');
    }
}

/**
 * Get supported video MIME type
 * iOS Safari requires MP4/H264, Firefox prefers VP8, others prefer VP9
 */
export function getVideoMimeType(): string {
    // Check if MediaRecorder exists
    if (typeof window === 'undefined' || !window.MediaRecorder) {
        return '';
    }

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
        return ''; // Let browser choose - don't return unsupported type
    }

    // Firefox (especially on Linux) may have issues with VP9
    if (isFirefox()) {
        const firefoxTypes = [
            'video/webm;codecs=vp8,opus',
            'video/webm;codecs=vp8,vorbis',
            'video/webm;codecs=vp9,opus',
            'video/webm',
        ];

        for (const type of firefoxTypes) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
    }

    // Chrome/Edge and other browsers
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

    // Return empty string - don't return unsupported hardcoded type
    return '';
}

/**
 * Convert MIME type to file extension
 */
export function getFileExtensionForMimeType(mimeType: string): string {
    if (!mimeType) {
        return '.webm'; // Safe default for empty mimeType
    }

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

    return '.webm'; // Default fallback
}
