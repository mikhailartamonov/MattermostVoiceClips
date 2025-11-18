module github.com/mikhailartamonov/mattermost-voice-clips/server

go 1.21

require (
	github.com/mattermost/mattermost/server/public v0.0.0-20240101000000-000000000000
	github.com/pkg/errors v0.9.1
	github.com/stretchr/testify v1.8.4
)

require (
	github.com/davecgh/go-spew v1.1.1 // indirect
	github.com/pmezard/go-difflib v1.0.0 // indirect
	github.com/stretchr/objx v0.5.0 // indirect
	gopkg.in/yaml.v3 v3.0.1 // indirect
)

replace github.com/mattermost/mattermost/server/public => github.com/mattermost/mattermost/server/public v0.1.0
