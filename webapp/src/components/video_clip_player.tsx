import React, {useEffect, useState, useRef} from 'react';

interface VideoClipPlayerProps {
    post: any;
    fileInfo?: any;
}

const VideoClipPlayer: React.FC<VideoClipPlayerProps> = ({post, fileInfo}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
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

    const formatTime = (seconds: number): string => {
        if (isNaN(seconds) || !isFinite(seconds)) {
            return '0:00';
        }
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="video-clip-player" style={containerStyle}>
            <div className="video-container" style={videoContainerStyle}>
                <video
                    ref={videoRef}
                    src={getFileUrl()}
                    controls
                    preload="metadata"
                    style={videoStyle}
                />
            </div>

            <div className="video-info" style={infoStyle}>
                <span style={labelStyle}>📹 Video Message</span>
                <span style={timeStyle}>
                    {formatTime(currentTime)} / {formatTime(duration)}
                </span>
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
    maxWidth: '480px',
    border: '1px solid #ddd',
};

const videoContainerStyle: React.CSSProperties = {
    width: '100%',
    borderRadius: '4px',
    overflow: 'hidden',
    backgroundColor: '#000',
};

const videoStyle: React.CSSProperties = {
    width: '100%',
    height: 'auto',
    display: 'block',
};

const infoStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '8px',
};

const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    color: '#888',
    fontStyle: 'italic',
};

const timeStyle: React.CSSProperties = {
    fontSize: '11px',
    color: '#666',
    fontFamily: 'monospace',
};

export default VideoClipPlayer;
