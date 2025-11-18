import React, {useEffect, useState, useRef} from 'react';

interface VideoRecorderButtonProps {
    channelId?: string;
    onRecordingComplete?: (blob: Blob, duration: number) => void;
}

const VideoRecorderButton: React.FC<VideoRecorderButtonProps> = ({channelId, onRecordingComplete}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [duration, setDuration] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [previewUrl, setPreviewUrl] = useState<string>('');

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const handleOpenRecorder = () => {
            setIsModalOpen(true);
        };

        window.addEventListener('open-video-recorder', handleOpenRecorder);

        return () => {
            window.removeEventListener('open-video-recorder', handleOpenRecorder);
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    // Cleanup URL object to prevent memory leaks
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const requestPermission = async () => {
        try {
            // Request square video for circular display (Telegram-style)
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: {ideal: 480, max: 720},
                    height: {ideal: 480, max: 720},
                    aspectRatio: {ideal: 1},
                    facingMode: 'user',
                },
                audio: true,
            });

            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            setHasPermission(true);
            setErrorMessage('');
            return true;
        } catch (err) {
            console.error('Error requesting camera permission:', err);
            setHasPermission(false);
            setErrorMessage('Camera/microphone permission denied. Please allow access to record video messages.');
            return false;
        }
    };

    const startRecording = async () => {
        const permitted = await requestPermission();
        if (!permitted || !streamRef.current) {
            return;
        }

        try {
            const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
                ? 'video/webm;codecs=vp9,opus'
                : MediaRecorder.isTypeSupported('video/webm')
                ? 'video/webm'
                : 'video/mp4';

            const recorder = new MediaRecorder(streamRef.current, {
                mimeType,
                videoBitsPerSecond: 1500000, // 1.5 Mbps for smaller circular video
            });

            chunksRef.current = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, {type: mimeType});
                const url = URL.createObjectURL(blob);
                setPreviewUrl(url);
                uploadVideo(blob, duration);
            };

            recorder.start(100);
            mediaRecorderRef.current = recorder;
            setIsRecording(true);
            setDuration(0);

            timerRef.current = setInterval(() => {
                setDuration((prev) => prev + 1);
            }, 1000);
        } catch (err) {
            console.error('Error starting recording:', err);
            setErrorMessage('Failed to start recording. Please try again.');
        }
    };

    const pauseRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
    };

    const resumeRecording = () => {
        if (mediaRecorderRef.current && isPaused) {
            mediaRecorderRef.current.resume();
            setIsPaused(false);

            timerRef.current = setInterval(() => {
                setDuration((prev) => prev + 1);
            }, 1000);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();

            if (timerRef.current) {
                clearInterval(timerRef.current);
            }

            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }

            setIsRecording(false);
            setIsPaused(false);
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();

            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
        }

        chunksRef.current = [];
        setIsRecording(false);
        setIsPaused(false);
        setDuration(0);
        setPreviewUrl('');
        setIsModalOpen(false);
    };

    const uploadVideo = async (blob: Blob, dur: number) => {
        const formData = new FormData();
        const currentChannelId = channelId || getCurrentChannelId();

        formData.append('video', blob, `video_clip_${Date.now()}.webm`);
        formData.append('channel_id', currentChannelId);
        formData.append('duration', dur.toString());
        formData.append('type', 'video');

        try {
            const response = await fetch('/plugins/com.mattermost.voice-clips/api/v1/upload', {
                method: 'POST',
                body: formData,
                credentials: 'same-origin',
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const result = await response.json();
            console.log('Video clip uploaded:', result);

            if (onRecordingComplete) {
                onRecordingComplete(blob, dur);
            }

            setTimeout(() => {
                setIsModalOpen(false);
                setDuration(0);
                setPreviewUrl('');
            }, 1000);
        } catch (err) {
            console.error('Error uploading video clip:', err);
            setErrorMessage('Failed to upload video clip. Please try again.');
        }
    };

    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getCurrentChannelId = (): string => {
        const match = window.location.pathname.match(/\/([a-z0-9]{26})\/?$/);
        return match ? match[1] : '';
    };

    if (!isModalOpen) {
        return null;
    }

    return (
        <div className="video-recorder-modal" style={modalStyle}>
            <div className="video-recorder-content" style={contentStyle}>
                <div className="video-recorder-header" style={headerStyle}>
                    <h3>📹 Record Video Message</h3>
                    <button onClick={cancelRecording} style={closeButtonStyle}>✕</button>
                </div>

                <div className="video-recorder-body" style={bodyStyle}>
                    {hasPermission === false && (
                        <div className="error-message" style={errorStyle}>
                            {errorMessage}
                        </div>
                    )}

                    {hasPermission !== false && (
                        <>
                            {/* Circular Video Preview */}
                            <div className="video-preview" style={circularPreviewContainerStyle}>
                                <div style={circularVideoWrapperStyle}>
                                    {previewUrl ? (
                                        <video
                                            src={previewUrl}
                                            controls
                                            style={circularVideoStyle}
                                        />
                                    ) : (
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            muted
                                            playsInline
                                            style={circularVideoStyle}
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="duration-display" style={durationStyle}>
                                {formatDuration(duration)}
                            </div>

                            <div className="recording-indicator" style={indicatorStyle}>
                                {isRecording && !isPaused && (
                                    <span className="recording-pulse" style={pulseStyle}>⏺ Recording...</span>
                                )}
                                {isRecording && isPaused && (
                                    <span>⏸ Paused</span>
                                )}
                                {!isRecording && !previewUrl && (
                                    <span>Ready to record</span>
                                )}
                                {previewUrl && (
                                    <span>✅ Recording completed</span>
                                )}
                            </div>

                            {!previewUrl && (
                                <div className="controls" style={controlsStyle}>
                                    {!isRecording && (
                                        <button onClick={startRecording} style={{...buttonStyle, ...recordButtonStyle}}>
                                            📹 Start Recording
                                        </button>
                                    )}

                                    {isRecording && !isPaused && (
                                        <>
                                            <button onClick={pauseRecording} style={{...buttonStyle, ...pauseButtonStyle}}>
                                                ⏸ Pause
                                            </button>
                                            <button onClick={stopRecording} style={{...buttonStyle, ...stopButtonStyle}}>
                                                ⏹ Stop & Send
                                            </button>
                                        </>
                                    )}

                                    {isRecording && isPaused && (
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
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// Styles
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
    borderRadius: '12px',
    padding: '0',
    width: '360px',
    maxWidth: '90%',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
};

const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #eee',
};

const closeButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#666',
    padding: '4px',
};

const bodyStyle: React.CSSProperties = {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
};

const errorStyle: React.CSSProperties = {
    backgroundColor: '#fee',
    color: '#c00',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '16px',
    width: '100%',
    textAlign: 'center',
};

const circularPreviewContainerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '16px',
};

const circularVideoWrapperStyle: React.CSSProperties = {
    width: '240px',
    height: '240px',
    borderRadius: '50%',
    overflow: 'hidden',
    backgroundColor: '#000',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
};

const circularVideoStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
};

const durationStyle: React.CSSProperties = {
    fontSize: '32px',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '12px',
    fontFamily: 'monospace',
};

const indicatorStyle: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: '20px',
    fontSize: '14px',
    color: '#666',
};

const pulseStyle: React.CSSProperties = {
    color: '#d32f2f',
};

const controlsStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    width: '100%',
};

const buttonStyle: React.CSSProperties = {
    padding: '12px 20px',
    fontSize: '14px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.2s',
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

export default VideoRecorderButton;
