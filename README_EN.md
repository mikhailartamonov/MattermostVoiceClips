# Mattermost Voice Clips

A cross-platform voice messaging plugin for Mattermost that works on web, desktop, iOS, and Android.

## 🎯 Features

- ✅ **Cross-platform**: Works on web, desktop, iOS (Safari 14.3+), and Android (Chrome)
- 🎤 **Easy Recording**: Intuitive voice message recording interface
- ⏸️ **Pause/Resume**: Ability to pause and resume recording
- 🎵 **Optimal Quality**: Uses WebM (Opus codec) for the best balance of quality and size
- 📱 **Mobile Optimized**: Fully responsive interface for mobile devices
- 🔒 **Secure**: Proper microphone permission handling

## 🔄 Differences from mattermost-plugin-voice

The existing [mattermost-plugin-voice](https://github.com/streamer45/mattermost-plugin-voice) plugin has a critical limitation: it only works on web and desktop clients but **does not support mobile devices**.

**Voice Clips** solves this problem by using the modern MediaRecorder API, which is supported in all mobile browsers:
- iOS Safari 14.3+
- Android Chrome
- Mattermost mobile apps (via WebView)

## 📋 Requirements

- Mattermost Server 7.1.0 or higher
- Go 1.21 or higher (for building)
- Node.js 20.11 or higher (for building)
- npm 10.x or higher (for building)

## 🚀 Installation

### From Pre-built Package

1. Download the latest release from [Releases](https://github.com/mikhailartamonov/MattermostVoiceClips/releases)
2. In Mattermost, go to **System Console** → **Plugins** → **Plugin Management**
3. Click **Upload Plugin** and select the downloaded `.tar.gz` file
4. Activate the plugin

### Build from Source

```bash
# Clone the repository
git clone https://github.com/mikhailartamonov/MattermostVoiceClips.git
cd MattermostVoiceClips

# Install dependencies and build the plugin
make dist

# The plugin will be created at dist/com.mattermost.voice-clips-0.1.0.tar.gz
```

### Deploy to Local Server

For automatic deployment to a local Mattermost server:

```bash
# Set environment variables
export MM_SERVICESETTINGS_SITEURL=http://localhost:8065
export MM_ADMIN_TOKEN=your-admin-token

# Deploy the plugin
make deploy
```

## 📖 Usage

### Recording a Voice Message

1. In any channel, click the microphone button 🎤 in the channel header
2. Allow microphone access (first time only)
3. Click **Start Recording** to begin
4. Use the buttons:
   - ⏸️ **Pause** - pause recording
   - ▶️ **Resume** - resume recording
   - ⏹️ **Stop & Send** - stop and send the message
   - 🗑️ **Cancel** - cancel recording

### On Mobile Devices

On iOS and Android, the interface works exactly like on desktop. The browser will request microphone permission on first use.

## ⚙️ Configuration

In **System Console** → **Plugins** → **Voice Clips**, the following settings are available:

- **Maximum Recording Duration** (default: 300 seconds / 5 minutes)
  - Maximum duration for voice recordings

- **Audio Format** (default: WebM)
  - WebM (Opus codec) - best for web and mobile devices
  - MP4 (AAC codec) - universal compatibility

- **Enable Waveform Visualization** (default: enabled)
  - Show audio waveform during playback

## 🛠️ Development

### Project Structure

```
MattermostVoiceClips/
├── server/              # Server-side (Go)
│   ├── plugin.go       # Main plugin logic
│   ├── configuration.go # Configuration
│   └── main.go         # Entry point
├── webapp/              # Web interface (React/TypeScript)
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── utils/      # Utilities (including MediaRecorder)
│   │   └── index.tsx   # Entry point
│   └── package.json
├── assets/              # Resources (icons, etc.)
├── plugin.json         # Plugin manifest
└── Makefile            # Build system
```

### Development Commands

```bash
# Install all dependencies
make deps

# Build server only
make server

# Build webapp only
make webapp

# Build entire plugin
make dist

# Run in development mode (auto-rebuild webapp)
make watch

# Run tests
make test

# Clean build artifacts
make clean
```

## 🔧 Technical Details

### Why Does This Work on Mobile?

The key difference from the old plugin is the use of **MediaRecorder API**:

- ✅ Supported in iOS Safari 14.3+ (with WebM/Opus)
- ✅ Supported in Android Chrome (with WebM/Opus)
- ✅ Works in WebView of Mattermost mobile apps
- ✅ No need for native extensions or special APIs

### Browser Compatibility

| Platform | Browser | Support |
|----------|---------|---------|
| Desktop | Chrome/Edge | ✅ |
| Desktop | Firefox | ✅ |
| Desktop | Safari | ✅ |
| iOS | Safari 14.3+ | ✅ |
| Android | Chrome | ✅ |
| Mattermost Mobile App | WebView | ✅ |

### Audio Format

By default, **WebM with Opus codec** is used:
- Excellent quality with small file size
- Bitrate: 128 kbps
- Noise suppression and echo cancellation support
- Universal support in modern browsers

## 🐛 Known Issues

- On iOS Safari, user interaction may be required before the first microphone permission request
- Older browsers (< 2020) may not support MediaRecorder API

## 📝 License

MIT License - see [LICENSE](LICENSE) file

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss.

## 📧 Support

If you encounter problems or have questions:
1. Check [Issues](https://github.com/mikhailartamonov/MattermostVoiceClips/issues)
2. Create a new issue with problem description
3. Include Mattermost version, browser, and OS

## 🙏 Acknowledgments

- [mattermost-plugin-voice](https://github.com/streamer45/mattermost-plugin-voice) - for inspiration
- [mattermost-plugin-calls](https://github.com/mattermost/mattermost-plugin-calls) - for cross-platform implementation examples
- Mattermost community for excellent plugin development documentation
