# Configuration Guide

Configure the Voice & Video Clips plugin through **System Console** > **Plugins** > **Voice & Video Clips**.

## Audio Settings

### Maximum Audio Recording Duration
- **Setting**: `MaxDuration`
- **Default**: 300 seconds (5 minutes)
- **Description**: Maximum length for voice recordings

### Maximum Audio File Size
- **Setting**: `MaxAudioFileSize`
- **Default**: 50 MB
- **Description**: Maximum file size for audio uploads

### Preferred Audio Format
- **Setting**: `AudioFormat`
- **Default**: WebM
- **Options**:
  - **WebM (Opus)** - Best for Chrome, Firefox
  - **OGG (Opus)** - Best for Firefox on Linux
  - **MP4 (AAC)** - Best for iOS Safari

### Audio Bitrate
- **Setting**: `AudioBitrate`
- **Default**: 128 kbps
- **Options**:
  - 64 kbps - Low quality, small files
  - 96 kbps - Medium quality
  - 128 kbps - Good quality (recommended)
  - 192 kbps - High quality
  - 256 kbps - Very high quality

### Allowed Audio Formats
- **Setting**: `AllowedAudioFormats`
- **Default**: `webm,ogg,mp4,m4a,mp3,aac,wav`
- **Description**: Comma-separated list of allowed audio file extensions

## Video Settings

### Maximum Video Recording Duration
- **Setting**: `MaxVideoDuration`
- **Default**: 120 seconds (2 minutes)
- **Description**: Maximum length for video recordings

### Maximum Video File Size
- **Setting**: `MaxVideoFileSize`
- **Default**: 100 MB
- **Description**: Maximum file size for video uploads

### Preferred Video Format
- **Setting**: `VideoFormat`
- **Default**: WebM
- **Options**:
  - **WebM (VP9/VP8)** - Best for Chrome, Firefox
  - **MP4 (H.264)** - Best for iOS Safari

### Video Bitrate
- **Setting**: `VideoBitrate`
- **Default**: 1500 kbps
- **Options**:
  - 500 kbps - Low quality, small files
  - 1000 kbps - Medium quality
  - 1500 kbps - Good quality (recommended)
  - 2500 kbps - High quality
  - 4000 kbps - Very high quality

### Allowed Video Formats
- **Setting**: `AllowedVideoFormats`
- **Default**: `webm,mp4,mov`
- **Description**: Comma-separated list of allowed video file extensions

## UI Settings

### Enable Waveform Visualization
- **Setting**: `EnableWaveform`
- **Default**: true
- **Description**: Show audio waveform during playback

## Recommended Settings

### Low Bandwidth / Storage Constrained
```
Audio Bitrate: 64 kbps
Video Bitrate: 500 kbps
Max Audio Duration: 60 seconds
Max Video Duration: 30 seconds
Max Audio File Size: 10 MB
Max Video File Size: 20 MB
```

### Balanced (Default)
```
Audio Bitrate: 128 kbps
Video Bitrate: 1500 kbps
Max Audio Duration: 300 seconds
Max Video Duration: 120 seconds
Max Audio File Size: 50 MB
Max Video File Size: 100 MB
```

### High Quality
```
Audio Bitrate: 192 kbps
Video Bitrate: 2500 kbps
Max Audio Duration: 600 seconds
Max Video Duration: 300 seconds
Max Audio File Size: 100 MB
Max Video File Size: 250 MB
```

## Security Considerations

### File Validation
- All uploads are validated against magic numbers (file signatures)
- File extensions must match allowed formats list
- Maximum file sizes are enforced server-side

### Permissions
- Users must have `create_post` permission in the channel
- Authentication is required for all API endpoints

### Recommendations
- Keep allowed formats list minimal
- Set reasonable file size limits
- Consider bandwidth costs when setting bitrates
