# API Reference

## Base URL
```
/plugins/com.mattermost.voice-clips/api/v1
```

## Authentication
All endpoints require Mattermost authentication. The `Mattermost-User-Id` header is automatically set by Mattermost.

---

## Endpoints

### Upload Media

**POST** `/upload`

Upload a voice or video clip and create a post.

#### Request

**Content-Type**: `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `audio` | File | Yes* | Audio file (for voice clips) |
| `video` | File | Yes* | Video file (for video clips) |
| `channel_id` | String | Yes | Target channel ID |
| `duration` | String | No | Recording duration in seconds |
| `type` | String | No | "video" for video clips, omit for audio |

\* Either `audio` or `video` is required

#### Response

**Success (200)**
```json
{
  "post_id": "abc123def456",
  "file_id": "xyz789"
}
```

**Errors**

| Code | Message | Description |
|------|---------|-------------|
| 400 | `channel_id is required` | Missing channel_id |
| 400 | `Failed to get media file` | Missing audio/video file |
| 400 | `File is too small or empty` | File under 1 KB |
| 400 | `Invalid audio/video file format` | Extension not allowed |
| 400 | `File content does not match expected format` | Magic number mismatch |
| 400 | `Duration exceeds maximum allowed` | Duration over limit |
| 401 | `Unauthorized` | Not authenticated |
| 403 | `No permission to post in this channel` | Missing channel permission |
| 405 | `Method not allowed` | Not a POST request |
| 413 | `File size exceeds maximum allowed` | File over size limit |
| 500 | `Failed to upload file` | Server error |
| 500 | `Failed to create post` | Post creation error |

#### Example

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "audio=@voice_clip.webm" \
  -F "channel_id=abc123" \
  -F "duration=15" \
  http://localhost:8065/plugins/com.mattermost.voice-clips/api/v1/upload
```

---

### Get Configuration

**GET** `/config`

Get plugin configuration for client-side use.

#### Response

**Success (200)**
```json
{
  "max_duration": 300,
  "audio_format": "webm",
  "enable_waveform": true,
  "max_audio_file_size": 50,
  "audio_bitrate": 128,
  "max_video_duration": 120,
  "video_format": "webm",
  "max_video_file_size": 100,
  "video_bitrate": 1500,
  "allowed_audio_formats": "webm,ogg,mp4,m4a,mp3,aac,wav",
  "allowed_video_formats": "webm,mp4,mov"
}
```

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| `max_duration` | Number | Max audio duration (seconds) |
| `audio_format` | String | Preferred audio format |
| `enable_waveform` | Boolean | Show waveform visualization |
| `max_audio_file_size` | Number | Max audio file size (MB) |
| `audio_bitrate` | Number | Audio bitrate (kbps) |
| `max_video_duration` | Number | Max video duration (seconds) |
| `video_format` | String | Preferred video format |
| `max_video_file_size` | Number | Max video file size (MB) |
| `video_bitrate` | Number | Video bitrate (kbps) |
| `allowed_audio_formats` | String | Allowed audio extensions |
| `allowed_video_formats` | String | Allowed video extensions |

#### Example

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8065/plugins/com.mattermost.voice-clips/api/v1/config
```

---

## Slash Commands

### /voice

Opens the voice recorder modal.

**Usage**: `/voice`

**Response**: Ephemeral message with instructions + WebSocket event to open recorder.

### /video

Opens the video recorder modal.

**Usage**: `/video`

**Response**: Ephemeral message with instructions + WebSocket event to open recorder.

---

## WebSocket Events

### Plugin Events

#### open_voice_recorder
Triggered by `/voice` command or plugin action.

```json
{
  "event": "custom_com.mattermost.voice-clips_open_voice_recorder",
  "data": {
    "channel_id": "abc123"
  }
}
```

#### open_video_recorder
Triggered by `/video` command or plugin action.

```json
{
  "event": "custom_com.mattermost.voice-clips_open_video_recorder",
  "data": {
    "channel_id": "abc123"
  }
}
```

---

## Custom Post Types

### custom_voice_clip

Voice message post type.

**Props**:
```json
{
  "voice_clip": {
    "duration": 15,
    "format": ".webm"
  }
}
```

### custom_video_clip

Video message post type.

**Props**:
```json
{
  "video_clip": {
    "duration": 30,
    "format": ".webm"
  }
}
```

---

## File Validation

### Supported Audio Formats

| Format | Extension | Magic Number |
|--------|-----------|--------------|
| WebM | .webm | `1A 45 DF A3` |
| OGG | .ogg | `OggS` |
| MP4 | .mp4 | `ftyp` at offset 4 |
| M4A | .m4a | `ftyp` at offset 4 |
| WAV | .wav | `RIFF...WAVE` |
| MP3 | .mp3 | `ID3` or `FF Fx` |
| AAC | .aac | `FF F1` or `FF F9` |

### Supported Video Formats

| Format | Extension | Magic Number |
|--------|-----------|--------------|
| WebM | .webm | `1A 45 DF A3` |
| MP4 | .mp4 | `ftyp` at offset 4 |
| MOV | .mov | `ftyp` at offset 4 |

---

## Error Handling

All error responses follow this format:

```
HTTP/1.1 {status_code}
Content-Type: text/plain

{error_message}
```

Errors are also logged server-side with additional context.
