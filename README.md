# Mattermost Voice & Video Clips

Cross-platform voice and video messaging plugin for Mattermost with full support for web, desktop, iOS and Android.

## Features

### Voice Messages
- **Cross-platform**: Works on web, desktop, iOS (Safari 14.3+) and Android (Chrome)
- **Easy recording**: Intuitive recording interface with pause/resume
- **Quality audio**: Uses WebM (Opus codec) for optimal quality and size
- **Waveform visualization**: Audio waveform display during playback
- **Smart player**: Speed control (1x, 1.25x, 1.5x, 2x), seeking
- **Slash command**: Quick access via `/voice`

### Video Messages
- **Video recording**: Camera recording with real-time circular preview (Telegram-style)
- **High quality**: VP9/VP8 codec for excellent quality at small file sizes
- **Mobile support**: Works on all mobile devices
- **Recording controls**: Pause, resume, cancel
- **Slash command**: Quick access via `/video`

### General
- **Mobile-first design**: Fully responsive interface for mobile devices
- **Security**: Proper permission requests for camera and microphone
- **Validation**: File type, size (up to 50 MB audio, 100 MB video), permissions
- **Internationalization**: 12 languages supported (auto-detects system language)
- **Notifications**: Custom notification sounds for incoming voice/video messages

## Why This Plugin?

The existing [mattermost-plugin-voice](https://github.com/streamer45/mattermost-plugin-voice) has a critical limitation: it only works on web and desktop clients, with **no mobile device support**.

**Voice & Video Clips** solves this by using the modern MediaRecorder API, supported in all mobile browsers:
- iOS Safari 14.3+
- Android Chrome
- Mattermost mobile apps (via WebView)

## Requirements

- Mattermost Server 7.1.0 or higher
- Go 1.19+ (for building)
- Node.js 18+ (for building)

## Installation

### From Pre-built Package

1. Download the latest release from [Releases](https://github.com/mikhailartamonov/MattermostVoiceClips/releases)
2. In Mattermost, go to **System Console** > **Plugins** > **Plugin Management**
3. Click **Upload Plugin** and select the downloaded `.tar.gz` file
4. Enable the plugin

### Building from Source

```bash
git clone https://github.com/mikhailartamonov/MattermostVoiceClips.git
cd MattermostVoiceClips
make dist
# Plugin will be created at dist/com.mattermost.voice-clips-X.X.X.tar.gz
```

## Usage

### Recording Voice Messages

1. Click the microphone icon in the channel header
2. Allow microphone access (first time only)
3. Click **Start Recording**
4. Use controls: Pause, Resume, Stop & Send, Cancel

Or use the slash command: `/voice`

### Recording Video Messages

1. Click the video icon in the channel header
2. Allow camera and microphone access (first time only)
3. Click **Start Recording**
4. Use controls: Pause, Resume, Stop & Send, Cancel

Or use the slash command: `/video`

### Playback

- Play/pause controls
- Waveform visualization (audio)
- Circular video display
- Seek by clicking on progress bar
- Playback speed control (1x, 1.25x, 1.5x, 2x)

## Configuration

Configure in **System Console** > **Plugins** > **Voice & Video Clips**:

- **Audio duration**: Max recording length (default: 5 minutes)
- **Video duration**: Max recording length (default: 2 minutes)
- **File sizes**: Max upload sizes (default: 50 MB audio, 100 MB video)
- **Bitrates**: Audio (64-256 kbps), Video (500-4000 kbps)
- **Formats**: Allowed file formats
- **Waveform**: Enable/disable visualization

See [Configuration Guide](doc/CONFIGURATION.md) for details.

## Browser Support

| Platform | Browser | Support |
|----------|---------|---------|
| Desktop | Chrome/Edge | Full |
| Desktop | Firefox | Full |
| Desktop | Safari | Full |
| iOS | Safari 14.3+ | Full |
| Android | Chrome | Full |
| Mobile App | WebView | Full |

## Documentation

- [Installation Guide](doc/INSTALLATION.md)
- [Configuration Guide](doc/CONFIGURATION.md)
- [Architecture Overview](doc/ARCHITECTURE.md)
- [Development Guide](doc/DEVELOPMENT.md)
- [API Reference](doc/API.md)

## Supported Languages

The plugin automatically detects your system language:

- English, Russian, German, French, Spanish, Portuguese
- Chinese, Japanese, Korean, Italian, Dutch, Polish

## Development

```bash
# Install dependencies
cd webapp && npm install

# Build plugin
make dist

# Watch mode (auto-rebuild)
make watch

# Run tests
cd server && go test -v ./...
```

See [Development Guide](doc/DEVELOPMENT.md) for more details.

## Known Issues

- iOS Safari may require user interaction before first microphone permission request
- Old browsers (< 2020) may not support MediaRecorder API

## License

MIT License - see [LICENSE](LICENSE)

## Contributing

Pull requests welcome! For major changes, please open an issue first to discuss.

## Support

If you have issues or questions:
1. Check [Issues](https://github.com/mikhailartamonov/MattermostVoiceClips/issues)
2. Create a new issue with description
3. Include Mattermost version, browser, and OS

## Acknowledgments

- [mattermost-plugin-voice](https://github.com/streamer45/mattermost-plugin-voice) - for inspiration
- [mattermost-plugin-calls](https://github.com/mattermost/mattermost-plugin-calls) - for cross-platform examples
- Mattermost community for excellent plugin development documentation
