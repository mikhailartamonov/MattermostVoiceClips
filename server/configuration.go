package main

import (
	"reflect"

	"github.com/pkg/errors"
)

// configuration captures the plugin's external configuration as exposed in the Mattermost server
// configuration, as well as values computed from the configuration. Any public fields will be
// deserialized from the Mattermost server configuration in OnConfigurationChange.
type configuration struct {
	// Audio settings
	MaxDuration      int    `json:"max_duration"`
	AudioFormat      string `json:"audio_format"`
	EnableWaveform   bool   `json:"enable_waveform"`
	MaxAudioFileSize int    `json:"max_audio_file_size"`
	AudioBitrate     int    `json:"audio_bitrate"`

	// Video settings
	MaxVideoDuration int    `json:"max_video_duration"`
	VideoFormat      string `json:"video_format"`
	MaxVideoFileSize int    `json:"max_video_file_size"`
	VideoBitrate     int    `json:"video_bitrate"`

	// Allowed formats (comma-separated)
	AllowedAudioFormats string `json:"allowed_audio_formats"`
	AllowedVideoFormats string `json:"allowed_video_formats"`
}

// Clone shallow copies the configuration. Your implementation may require a deep copy if
// your configuration has reference types.
func (c *configuration) Clone() *configuration {
	var clone = *c
	return &clone
}

// getConfiguration retrieves the active configuration under lock, making it safe to use
// concurrently. The active configuration may change underneath the client of this method, but
// the struct returned by this API call is considered immutable.
func (p *Plugin) getConfiguration() *configuration {
	p.configurationLock.RLock()
	defer p.configurationLock.RUnlock()

	if p.configuration == nil {
		return &configuration{
			// Audio defaults
			MaxDuration:      300,
			AudioFormat:      "webm",
			EnableWaveform:   true,
			MaxAudioFileSize: 50,
			AudioBitrate:     128,

			// Video defaults
			MaxVideoDuration: 120,
			VideoFormat:      "webm",
			MaxVideoFileSize: 100,
			VideoBitrate:     1500,

			// Allowed formats defaults
			AllowedAudioFormats: "webm,ogg,mp4,m4a,mp3,aac,wav",
			AllowedVideoFormats: "webm,mp4,mov",
		}
	}

	return p.configuration
}

// setConfiguration replaces the active configuration under lock.
func (p *Plugin) setConfiguration(configuration *configuration) {
	p.configurationLock.Lock()
	defer p.configurationLock.Unlock()

	if configuration != nil && p.configuration == configuration {
		// Ignore assignment if the configuration struct is empty. Go will optimize the
		// allocation for same to point at the same memory address, breaking the check
		// above.
		if reflect.ValueOf(*configuration).NumField() == 0 {
			return
		}

		panic("setConfiguration called with the existing configuration")
	}

	p.configuration = configuration
}

// OnConfigurationChange is invoked when configuration changes may have been made.
func (p *Plugin) OnConfigurationChange() error {
	var configuration = new(configuration)

	// Load the public configuration fields from the Mattermost server configuration.
	if err := p.API.LoadPluginConfiguration(configuration); err != nil {
		return errors.Wrap(err, "failed to load plugin configuration")
	}

	p.setConfiguration(configuration)

	return nil
}
