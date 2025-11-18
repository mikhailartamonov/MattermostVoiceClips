# Installation Guide

## Prerequisites

- Mattermost Server 7.1.0 or higher
- System Administrator access to Mattermost

## Installation Methods

### Method 1: Plugin Marketplace (Recommended)

1. Go to **System Console** > **Plugin Management** > **Plugin Marketplace**
2. Search for "Voice & Video Clips"
3. Click **Install**
4. Once installed, click **Configure** to adjust settings

### Method 2: Manual Installation

1. Download the latest release from the [releases page](https://github.com/mikhailartamonov/MattermostVoiceClips/releases)
2. Go to **System Console** > **Plugin Management** > **Management**
3. Click **Upload Plugin** and select the downloaded `.tar.gz` file
4. Click **Enable** to activate the plugin

## Building from Source

### Requirements

- Go 1.19 or higher
- Node.js 18 or higher
- npm 9 or higher
- Make

### Build Steps

```bash
# Clone the repository
git clone https://github.com/mikhailartamonov/MattermostVoiceClips.git
cd MattermostVoiceClips

# Build the plugin
make dist

# The plugin bundle will be created at dist/com.mattermost.voice-clips-X.X.X.tar.gz
```

### Development Mode

For local development with hot reloading:

```bash
# Install dependencies
cd webapp && npm install

# Start development build
make watch
```

## Post-Installation

1. After enabling the plugin, users will see microphone and video icons in the channel header
2. Configure plugin settings in **System Console** > **Plugins** > **Voice & Video Clips**
3. Test by clicking the microphone icon to record a voice message

## Browser Support

The plugin works on all modern browsers:

- **Chrome/Edge**: Full support (WebM/VP9/Opus)
- **Firefox**: Full support (WebM/VP8/Opus, OGG/Opus)
- **Safari**: Full support (MP4/H.264/AAC)
- **iOS Safari**: Supported (requires Safari 14.3+)
- **Android Chrome**: Full support

## Troubleshooting

### Microphone/Camera Permission Issues

- Ensure your browser has permission to access microphone and camera
- HTTPS is required for media device access
- Check browser settings for blocked permissions

### Upload Failures

- Check maximum file size settings in plugin configuration
- Verify the user has permission to post in the channel
- Check Mattermost server logs for detailed error messages

### Playback Issues

- Ensure the browser supports the recorded format
- Check if the audio/video file was uploaded correctly
- Try refreshing the page

## Uninstallation

1. Go to **System Console** > **Plugin Management** > **Management**
2. Find "Voice & Video Clips" plugin
3. Click **Disable** then **Remove**

All previously recorded messages will remain in Mattermost as file attachments.
