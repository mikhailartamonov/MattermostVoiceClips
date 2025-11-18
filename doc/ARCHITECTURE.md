# Architecture Overview

## Plugin Structure

```
MattermostVoiceClips/
├── server/                  # Go backend
│   ├── plugin.go           # Main plugin entry point
│   ├── configuration.go    # Configuration management
│   └── main.go            # Plugin manifest
├── webapp/                  # React frontend
│   └── src/
│       ├── index.tsx       # Plugin registration
│       ├── components/     # React components
│       ├── utils/          # Utility functions
│       └── i18n/           # Internationalization
├── plugin.json             # Plugin manifest
└── doc/                    # Documentation
```

## Components

### Server Components

#### Plugin (plugin.go)
- Handles HTTP API endpoints
- Manages file uploads
- Creates posts with media attachments
- Validates file content and permissions
- Registers slash commands

#### Configuration (configuration.go)
- Stores plugin settings
- Provides thread-safe access to configuration
- Handles configuration changes

### Webapp Components

#### VoiceRecorderButton
- Modal interface for recording voice messages
- Uses MediaRecorder API
- Supports pause/resume (where available)
- Auto-stops at maximum duration
- Uploads to server on completion

#### VideoRecorderButton
- Modal interface for recording video messages
- Circular Telegram-style preview
- Camera and microphone access
- Supports pause/resume (where available)

#### VoiceClipPlayer
- Custom post renderer for voice clips
- Waveform visualization
- Playback controls
- Duration display

#### VideoClipPlayer
- Custom post renderer for video clips
- Circular video display
- Playback controls

## Data Flow

### Recording Flow

```
User clicks record → MediaRecorder captures → Blob created →
Upload to /api/v1/upload → Server validates → File stored →
Post created → WebSocket notifies clients → UI updates
```

### Playback Flow

```
Post rendered → Custom component loaded → Media URL resolved →
Audio/Video element created → Playback controls rendered
```

## API Endpoints

### POST /api/v1/upload
Upload voice or video clip

**Request**:
- `audio` or `video`: Media file (multipart)
- `channel_id`: Target channel
- `duration`: Recording duration
- `type`: "audio" or "video"

**Response**:
```json
{
  "post_id": "...",
  "file_id": "..."
}
```

### GET /api/v1/config
Get plugin configuration for client

**Response**:
```json
{
  "max_duration": 300,
  "max_video_duration": 120,
  "audio_bitrate": 128000,
  "video_bitrate": 1500000,
  ...
}
```

## Cross-Platform Support

### Browser Detection
```typescript
isIOS()      // Detect iOS Safari
isFirefox()  // Detect Firefox
```

### Codec Selection

| Platform | Audio Codec | Video Codec |
|----------|-------------|-------------|
| Chrome/Edge | WebM/Opus | WebM/VP9 |
| Firefox | OGG/Opus or WebM/Opus | WebM/VP8 |
| Safari | MP4/AAC | MP4/H.264 |
| iOS Safari | MP4/AAC | MP4/H.264 |

### Feature Detection
```typescript
isPauseResumeSupported()  // Check pause/resume support
isAudioRecordingSupported()  // Check MediaRecorder support
```

## Internationalization

### Language Detection
- Detects system language via `navigator.language`
- Falls back to English if language not supported

### Supported Languages
- English (en)
- Russian (ru)
- German (de)
- French (fr)
- Spanish (es)
- Portuguese (pt)
- Chinese (zh)
- Japanese (ja)
- Korean (ko)
- Italian (it)
- Dutch (nl)
- Polish (pl)

## Notification System

### Sound Notifications
- Synthesized using Web Audio API
- Different sounds for voice vs video messages
- Only plays for incoming messages (not own)

## Security

### File Validation
1. Extension check against allowed list
2. Magic number validation (file signatures)
3. File size limits
4. MIME type verification

### Authentication
- All API endpoints require Mattermost authentication
- Channel permission verification for uploads

## WebSocket Events

### Plugin Events
- `open_voice_recorder`: Open voice recorder modal
- `open_video_recorder`: Open video recorder modal

### Standard Events
- `posted`: New post created (used for notifications)
