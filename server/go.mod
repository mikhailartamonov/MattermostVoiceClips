module github.com/mikhailartamonov/mattermost-voice-clips/server

go 1.21

require (
	github.com/mattermost/mattermost/server/public v0.0.0-20240101000000-000000000000
	github.com/pkg/errors v0.9.1
)

replace github.com/mattermost/mattermost/server/public => github.com/mattermost/mattermost/server/public v0.1.0
