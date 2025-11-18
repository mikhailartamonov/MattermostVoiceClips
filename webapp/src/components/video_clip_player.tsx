import React, {useEffect, useState, useRef} from 'react';

interface VideoClipPlayerProps {
    post: any;
}

const VideoClipPlayer: React.FC<VideoClipPlayerProps> = ({post}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    const getFileUrl = () => {
        if (post.file_ids && post.file_ids.length > 0) {
            const fileId = post.file_ids[0];
            return `/api/v4/files/${fileId}`;
        }
        return '';
    };

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleLoadedMetadata = () => {
            setDuration(video.duration);
        };

        const handleTimeUpdate = () => {
            setCurrentTime(video.currentTime);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            if (video) {
                video.currentTime = 0;
            }
        };

        const handlePlay = () => {
            setIsPlaying(true);
        };

        const handlePause = () => {
            setIsPlaying(false);
        };

        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('ended', handleEnded);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);

        return () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('ended', handleEnded);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
        };
    }, []);

    const togglePlay = () => {
        const video = videoRef.current;
        if (!video) return;

        if (isPlaying) {
            video.pause();
        } else {
            video.play().catch(() => {
                // Playback failed - likely autoplay policy
            });
        }
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        const video = videoRef.current;
        if (!video) return;

        video.muted = !video.muted;
        setIsMuted(!isMuted);
    };

    const formatTime = (seconds: number): string => {
        if (isNaN(seconds) || !isFinite(seconds)) {
            return '0:00';
        }
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Calculate progress for circular indicator
    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
    const circumference = 2 * Math.PI * 118; // radius = 118 (slightly less than container)
    const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

    return (
        <div className="video-clip-player" style={containerStyle}>
            {/* Circular video container */}
            <div style={circleContainerStyle} onClick={togglePlay}>
                {/* Progress ring */}
                <svg style={progressRingStyle} viewBox="0 0 240 240">
                    {/* Background ring */}
                    <circle
                        cx="120"
                        cy="120"
                        r="118"
                        fill="none"
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth="3"
                    />
                    {/* Progress ring */}
                    <circle
                        cx="120"
                        cy="120"
                        r="118"
                        fill="none"
                        stroke="#1976d2"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        transform="rotate(-90 120 120)"
                        style={{transition: 'stroke-dashoffset 0.1s linear'}}
                    />
                </svg>

                {/* Video element */}
                <video
                    ref={videoRef}
                    src={getFileUrl()}
                    preload="metadata"
                    muted={isMuted}
                    playsInline
                    style={videoStyle}
                />

                {/* Play/Pause overlay */}
                {!isPlaying && (
                    <div style={playOverlayStyle}>
                        <div style={playButtonStyle}>▶</div>
                    </div>
                )}

                {/* Duration badge */}
                <div style={durationBadgeStyle}>
                    {formatTime(isPlaying ? duration - currentTime : duration)}
                </div>

                {/* Mute button */}
                <button
                    style={muteButtonStyle}
                    onClick={toggleMute}
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                    {isMuted ? '🔇' : '🔊'}
                </button>
            </div>
        </div>
    );
};

// Telegram-style circular video styles
const containerStyle: React.CSSProperties = {
    display: 'inline-block',
    marginTop: '8px',
    marginBottom: '8px',
};

const circleContainerStyle: React.CSSProperties = {
    position: 'relative',
    width: '240px',
    height: '240px',
    borderRadius: '50%',
    overflow: 'hidden',
    cursor: 'pointer',
    backgroundColor: '#000',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
};

const progressRingStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 2,
    pointerEvents: 'none',
};

const videoStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
};

const playOverlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 3,
};

const playButtonStyle: React.CSSProperties = {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    color: '#1976d2',
    paddingLeft: '4px', // Visual centering for play icon
};

const durationBadgeStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '12px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontFamily: 'monospace',
    zIndex: 4,
};

const muteButtonStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '12px',
    right: '12px',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    zIndex: 4,
};

export default VideoClipPlayer;
