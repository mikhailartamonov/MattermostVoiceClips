import React, {useEffect, useState, useRef} from 'react';
import {getAudioRecorder, isPauseResumeSupported, getFileExtensionForMimeType} from '../utils/audio_recorder';
import {fetchPluginConfig, getAudioBitrate, getMaxAudioDuration} from '../utils/config_service';

interface VoiceRecorderButtonProps {
    channelId?: string;
    onRecordingComplete?: (blob: Blob, duration: number) => void;
}

const VoiceRecorderButton: React.FC<VoiceRecorderButtonProps> = ({channelId, onRecordingComplete}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [duration, setDuration] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [maxDuration, setMaxDuration] = useState(300);

    const recorderRef = useRef<any>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Listen for custom event to open recorder
        const handleOpenRecorder = async () => {
            // Load config when opening
            await fetchPluginConfig();
            setMaxDuration(getMaxAudioDuration());
            setIsModalOpen(true);
        };

        window.addEventListener('open-voice-recorder', handleOpenRecorder);

        return () => {
            window.removeEventListener('open-voice-recorder', handleOpenRecorder);
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    // Auto-stop when max duration reached
    useEffect(() => {
        if (isRecording && duration >= maxDuration) {
            stopRecording();
        }
    }, [duration, maxDuration, isRecording]);

    const requestPermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({audio: true});
            stream.getTracks().forEach((track) => track.stop());
            setHasPermission(true);
            setErrorMessage('');
            return true;
        } catch (err) {
            setHasPermission(false);
            setErrorMessage('Microphone permission denied. Please allow microphone access to record voice messages.');
            return false;
        }
    };

    const startRecording = async () => {
        const permitted = await requestPermission();
        if (!permitted) {
            return;
        }

        try {
            // Get audio bitrate from config
            const audioBitrate = getAudioBitrate();
            const recorder = await getAudioRecorder(audioBitrate);
            recorderRef.current = recorder;

            recorder.start();
            setIsRecording(true);
            setDuration(0);

            // Start timer
            timerRef.current = setInterval(() => {
                setDuration((prev) => prev + 1);
            }, 1000);
        } catch (err) {
            setErrorMessage('Failed to start recording. Please try again.');
        }
    };

    const pauseRecording = () => {
        if (recorderRef.current && isRecording && isPauseResumeSupported()) {
            recorderRef.current.pause();
            setIsPaused(true);
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
    };

    const resumeRecording = () => {
        if (recorderRef.current && isPaused && isPauseResumeSupported()) {
            recorderRef.current.resume();
            setIsPaused(false);

            // Resume timer
            timerRef.current = setInterval(() => {
                setDuration((prev) => prev + 1);
            }, 1000);
        }
    };

    const stopRecording = async () => {
        if (recorderRef.current) {
            const mimeType = recorderRef.current.getMimeType();
            const audioBlob = await recorderRef.current.stop();

            if (timerRef.current) {
                clearInterval(timerRef.current);
            }

            setIsRecording(false);
            setIsPaused(false);

            // Upload the audio with correct file extension
            await uploadAudio(audioBlob, duration, mimeType);

            // Reset state
            setDuration(0);
            setIsModalOpen(false);
        }
    };

    const cancelRecording = () => {
        if (recorderRef.current) {
            recorderRef.current.cancel();

            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }

        setIsRecording(false);
        setIsPaused(false);
        setDuration(0);
        setIsModalOpen(false);
    };

    const uploadAudio = async (blob: Blob, dur: number, mimeType: string) => {
        const formData = new FormData();
        const currentChannelId = channelId || getCurrentChannelId();

        // Use correct file extension based on actual mime type
        const extension = getFileExtensionForMimeType(mimeType);
        formData.append('audio', blob, `voice_clip_${Date.now()}${extension}`);
        formData.append('channel_id', currentChannelId);
        formData.append('duration', dur.toString());

        try {
            const response = await fetch('/plugins/com.mattermost.voice-clips/api/v1/upload', {
                method: 'POST',
                body: formData,
                credentials: 'same-origin',
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            await response.json();

            if (onRecordingComplete) {
                onRecordingComplete(blob, dur);
            }
        } catch (err) {
            setErrorMessage('Failed to upload voice clip. Please try again.');
        }
    };

    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getCurrentChannelId = (): string => {
        // Extract channel ID from URL or use a global state
        const match = window.location.pathname.match(/\/([a-z0-9]{26})\/?$/);
        return match ? match[1] : '';
    };

    if (!isModalOpen) {
        return null;
    }

    return (
        <div className="voice-recorder-modal" style={modalStyle}>
            <div className="voice-recorder-content" style={contentStyle}>
                <div className="voice-recorder-header" style={headerStyle}>
                    <h3>🎤 Record Voice Message</h3>
                    <button onClick={cancelRecording} style={closeButtonStyle}>✕</button>
                </div>

                <div className="voice-recorder-body" style={bodyStyle}>
                    {hasPermission === false && (
                        <div className="error-message" style={errorStyle}>
                            {errorMessage}
                        </div>
                    )}

                    {hasPermission !== false && (
                        <>
                            <div className="duration-display" style={durationStyle}>
                                {formatDuration(duration)}
                            </div>

                            <div className="recording-indicator" style={indicatorStyle}>
                                {isRecording && !isPaused && (
                                    <span className="recording-pulse" style={pulseStyle}>⏺</span>
                                )}
                                {isRecording && isPaused && (
                                    <span>⏸ Paused</span>
                                )}
                                {!isRecording && (
                                    <span>Ready to record</span>
                                )}
                            </div>

                            <div className="controls" style={controlsStyle}>
                                {!isRecording && (
                                    <button onClick={startRecording} style={{...buttonStyle, ...recordButtonStyle}}>
                                        🎤 Start Recording
                                    </button>
                                )}

                                {isRecording && !isPaused && (
                                    <>
                                        {isPauseResumeSupported() && (
                                            <button onClick={pauseRecording} style={{...buttonStyle, ...pauseButtonStyle}}>
                                                ⏸ Pause
                                            </button>
                                        )}
                                        <button onClick={stopRecording} style={{...buttonStyle, ...stopButtonStyle}}>
                                            ⏹ Stop & Send
                                        </button>
                                    </>
                                )}

                                {isRecording && isPaused && isPauseResumeSupported() && (
                                    <>
                                        <button onClick={resumeRecording} style={{...buttonStyle, ...resumeButtonStyle}}>
                                            ▶️ Resume
                                        </button>
                                        <button onClick={stopRecording} style={{...buttonStyle, ...stopButtonStyle}}>
                                            ⏹ Stop & Send
                                        </button>
                                    </>
                                )}

                                {isRecording && (
                                    <button onClick={cancelRecording} style={{...buttonStyle, ...cancelButtonStyle}}>
                                        🗑 Cancel
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// Inline styles for better mobile compatibility
const modalStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
};

const contentStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '0',
    minWidth: '320px',
    maxWidth: '90%',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};

const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #ddd',
};

const closeButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666',
};

const bodyStyle: React.CSSProperties = {
    padding: '24px',
};

const errorStyle: React.CSSProperties = {
    backgroundColor: '#fee',
    color: '#c00',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '16px',
};

const durationStyle: React.CSSProperties = {
    fontSize: '48px',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '16px',
    fontFamily: 'monospace',
};

const indicatorStyle: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: '24px',
    fontSize: '18px',
};

const pulseStyle: React.CSSProperties = {
    color: '#d32f2f',
    animation: 'pulse 1.5s infinite',
};

const controlsStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
};

const buttonStyle: React.CSSProperties = {
    padding: '12px 24px',
    fontSize: '16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'opacity 0.2s',
};

const recordButtonStyle: React.CSSProperties = {
    backgroundColor: '#1976d2',
    color: 'white',
};

const pauseButtonStyle: React.CSSProperties = {
    backgroundColor: '#f57c00',
    color: 'white',
};

const resumeButtonStyle: React.CSSProperties = {
    backgroundColor: '#388e3c',
    color: 'white',
};

const stopButtonStyle: React.CSSProperties = {
    backgroundColor: '#d32f2f',
    color: 'white',
};

const cancelButtonStyle: React.CSSProperties = {
    backgroundColor: '#757575',
    color: 'white',
};

export default VoiceRecorderButton;
