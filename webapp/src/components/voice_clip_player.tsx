import React, {useEffect, useState, useRef} from 'react';
import WaveformVisualizer from './waveform_visualizer';

interface VoiceClipPlayerProps {
    post: any;
}

const VoiceClipPlayer: React.FC<VoiceClipPlayerProps> = ({post}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1.0);
    const audioRef = useRef<HTMLAudioElement>(null);
    const progressBarRef = useRef<HTMLDivElement>(null);

    // Get file URL from post
    const getFileUrl = () => {
        if (post.file_ids && post.file_ids.length > 0) {
            const fileId = post.file_ids[0];
            return `/api/v4/files/${fileId}`;
        }
        return '';
    };

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
        };

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        const handleError = () => {
            setIsPlaying(false);
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);

        return () => {
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
        };
    }, []);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play().catch(() => {
                // Playback failed - likely autoplay policy
            });
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
        const audio = audioRef.current;
        const progressBar = progressBarRef.current;
        if (!audio || !progressBar) return;

        const rect = progressBar.getBoundingClientRect();

        // Handle both mouse and touch events
        const clientX = 'touches' in e
            ? e.touches[0].clientX
            : (e as React.MouseEvent).clientX;

        const clickX = clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, clickX / rect.width));
        const newTime = percentage * duration;

        audio.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const changePlaybackRate = () => {
        const rates = [1.0, 1.25, 1.5, 2.0];
        const currentIndex = rates.indexOf(playbackRate);
        const nextRate = rates[(currentIndex + 1) % rates.length];

        setPlaybackRate(nextRate);
        if (audioRef.current) {
            audioRef.current.playbackRate = nextRate;
        }
    };

    const formatTime = (seconds: number): string => {
        if (isNaN(seconds) || !isFinite(seconds)) {
            return '0:00';
        }
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="voice-clip-player" style={containerStyle}>
            <audio ref={audioRef} src={getFileUrl()} preload="metadata" />

            {/* Waveform Visualization */}
            <div style={{marginBottom: '8px'}}>
                <WaveformVisualizer
                    audioElement={audioRef.current}
                    isPlaying={isPlaying}
                    width={380}
                    height={50}
                />
            </div>

            <div className="player-content" style={contentStyle}>
                {/* Play/Pause Button */}
                <button
                    onClick={togglePlay}
                    style={playButtonStyle}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                    {isPlaying ? '⏸' : '▶️'}
                </button>

                {/* Progress Bar and Time */}
                <div className="player-info" style={infoStyle}>
                    <div
                        className="progress-bar-container"
                        style={progressBarContainerStyle}
                        ref={progressBarRef}
                        onClick={handleSeek}
                        onTouchStart={handleSeek}
                        onTouchMove={handleSeek}
                    >
                        <div className="progress-bar-bg" style={progressBarBgStyle}>
                            <div
                                className="progress-bar-fill"
                                style={{...progressBarFillStyle, width: `${progressPercentage}%`}}
                            />
                        </div>
                    </div>

                    <div className="time-display" style={timeDisplayStyle}>
                        <span>{formatTime(currentTime)}</span>
                        <span style={{color: '#888'}}> / </span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Playback Speed */}
                <button
                    onClick={changePlaybackRate}
                    style={speedButtonStyle}
                    title="Change playback speed"
                >
                    {playbackRate}x
                </button>
            </div>

            {/* Voice Clip Label */}
            <div className="voice-clip-label" style={labelStyle}>
                🎤 Voice Message
            </div>
        </div>
    );
};

// Styles
const containerStyle: React.CSSProperties = {
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    padding: '12px',
    marginTop: '8px',
    marginBottom: '8px',
    maxWidth: '400px',
    border: '1px solid #ddd',
};

const contentStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
};

const playButtonStyle: React.CSSProperties = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#1976d2',
    color: 'white',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'background-color 0.2s',
};

const infoStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    minWidth: 0,
};

const progressBarContainerStyle: React.CSSProperties = {
    cursor: 'pointer',
    padding: '4px 0',
};

const progressBarBgStyle: React.CSSProperties = {
    height: '4px',
    backgroundColor: '#ddd',
    borderRadius: '2px',
    overflow: 'hidden',
    position: 'relative',
};

const progressBarFillStyle: React.CSSProperties = {
    height: '100%',
    backgroundColor: '#1976d2',
    transition: 'width 0.1s linear',
};

const timeDisplayStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#555',
    fontFamily: 'monospace',
};

const speedButtonStyle: React.CSSProperties = {
    padding: '4px 8px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#555',
    flexShrink: 0,
    minWidth: '45px',
    transition: 'background-color 0.2s',
};

const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    color: '#888',
    marginTop: '8px',
    fontStyle: 'italic',
};

export default VoiceClipPlayer;
