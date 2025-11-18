# Development Guide

## Prerequisites

- Go 1.19+
- Node.js 18+
- npm 9+
- Make
- A running Mattermost server for testing

## Setup

### Clone Repository
```bash
git clone https://github.com/mikhailartamonov/MattermostVoiceClips.git
cd MattermostVoiceClips
```

### Install Dependencies
```bash
# Server dependencies (Go modules)
cd server && go mod download && cd ..

# Webapp dependencies
cd webapp && npm install && cd ..
```

## Development Workflow

### Build Plugin
```bash
make dist
```

This creates a deployable plugin at `dist/com.mattermost.voice-clips-X.X.X.tar.gz`

### Watch Mode
```bash
make watch
```

Rebuilds automatically when files change.

### Run Tests
```bash
# Server tests
cd server && go test -v ./...

# Webapp tests (if available)
cd webapp && npm test
```

### Lint Code
```bash
# Go linting
cd server && golangci-lint run

# TypeScript/JavaScript linting
cd webapp && npm run lint
```

## Project Structure

### Server (Go)

```
server/
├── plugin.go          # Main plugin, HTTP handlers
├── configuration.go   # Configuration struct and methods
├── main.go           # Plugin entry point
├── plugin_test.go    # Server tests
└── go.mod            # Go dependencies
```

### Webapp (TypeScript/React)

```
webapp/src/
├── index.tsx                    # Plugin registration
├── components/
│   ├── voice_recorder_button.tsx
│   ├── video_recorder_button.tsx
│   ├── voice_clip_player.tsx
│   ├── video_clip_player.tsx
│   └── waveform_visualizer.tsx
├── utils/
│   ├── audio_recorder.ts       # MediaRecorder wrapper
│   ├── config_service.ts       # Config fetching
│   └── notification_sound.ts   # Sound synthesis
└── i18n/
    └── translations.ts         # i18n system
```

## Adding New Features

### Adding a New Translation Key

1. Add the key to `TranslationKey` type in `webapp/src/i18n/translations.ts`
2. Add translations for all 12 languages
3. Use `t('yourKey')` in components

### Adding a New Configuration Option

1. Add field to `configuration` struct in `server/configuration.go`
2. Add to `settings_schema` in `plugin.json`
3. Add to `/api/v1/config` response in `plugin.go`
4. Update `config_service.ts` if needed on client

### Adding a New API Endpoint

1. Add case in `ServeHTTP` in `server/plugin.go`
2. Create handler function
3. Add tests in `server/plugin_test.go`

## Code Style

### Go
- Follow standard Go formatting (`gofmt`)
- Use meaningful variable names
- Add comments for exported functions

### TypeScript
- Use functional components with hooks
- Use TypeScript types/interfaces
- Follow existing code patterns

## Testing

### Manual Testing

1. Build plugin: `make dist`
2. Upload to Mattermost System Console
3. Enable plugin
4. Test recording and playback in different browsers

### Test Checklist

- [ ] Voice recording works
- [ ] Video recording works
- [ ] Pause/resume works (Chrome, Firefox)
- [ ] Playback works
- [ ] Waveform displays
- [ ] Configuration changes apply
- [ ] File size limits enforced
- [ ] Duration limits enforced
- [ ] Error messages display correctly
- [ ] Translations work
- [ ] Notification sounds play

## Debugging

### Server Logs
Check Mattermost server logs for plugin errors:
```bash
tail -f mattermost.log | grep voice-clips
```

### Browser Console
Open browser DevTools to see:
- JavaScript errors
- Network requests
- MediaRecorder events

### Common Issues

**Build fails**
- Check Go and Node.js versions
- Clear node_modules and reinstall

**Upload fails**
- Check file size limits
- Check server logs for detailed errors

**Recording fails**
- Check browser permissions
- Ensure HTTPS is enabled

## Release Process

1. Update version in `plugin.json`
2. Update CHANGELOG
3. Create git tag
4. Build release: `make dist`
5. Create GitHub release with artifact

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes
4. Add tests
5. Submit pull request

### Pull Request Guidelines

- Clear description of changes
- Tests pass
- No linting errors
- Documentation updated if needed
