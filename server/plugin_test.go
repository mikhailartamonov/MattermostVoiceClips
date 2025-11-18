package main

import (
	"bytes"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/mattermost/mattermost/server/public/model"
	"github.com/mattermost/mattermost/server/public/plugin/plugintest"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestIsValidMediaFile(t *testing.T) {
	tests := []struct {
		name      string
		data      []byte
		extension string
		isVideo   bool
		expected  bool
	}{
		{
			name:      "Valid WebM audio file",
			data:      []byte{0x1A, 0x45, 0xDF, 0xA3, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00},
			extension: ".webm",
			isVideo:   false,
			expected:  true,
		},
		{
			name:      "Valid WebM video file",
			data:      []byte{0x1A, 0x45, 0xDF, 0xA3, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00},
			extension: ".webm",
			isVideo:   true,
			expected:  true,
		},
		{
			name:      "Invalid WebM file",
			data:      []byte{0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00},
			extension: ".webm",
			isVideo:   false,
			expected:  false,
		},
		{
			name:      "Valid OGG file",
			data:      []byte("OggS" + string(make([]byte, 8))),
			extension: ".ogg",
			isVideo:   false,
			expected:  true,
		},
		{
			name:      "Invalid OGG file",
			data:      []byte{0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00},
			extension: ".ogg",
			isVideo:   false,
			expected:  false,
		},
		{
			name:      "Valid MP4 video file",
			data:      []byte{0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x00, 0x00, 0x00, 0x00}, // ftyp at offset 4
			extension: ".mp4",
			isVideo:   true,
			expected:  true,
		},
		{
			name:      "Valid WAV file",
			data:      []byte("RIFF" + string(make([]byte, 4)) + "WAVE"),
			extension: ".wav",
			isVideo:   false,
			expected:  true,
		},
		{
			name:      "File too small",
			data:      []byte{0x00, 0x00},
			extension: ".webm",
			isVideo:   false,
			expected:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := isValidMediaFile(tt.data, tt.extension, tt.isVideo)
			assert.Equal(t, tt.expected, result, "Expected %v for %s", tt.expected, tt.name)
		})
	}
}

func TestHandleConfig(t *testing.T) {
	// Setup
	api := &plugintest.API{}
	plugin := &Plugin{}
	plugin.SetAPI(api)

	// Set configuration
	plugin.setConfiguration(&configuration{
		MaxDuration:    300,
		AudioFormat:    "webm",
		EnableWaveform: true,
	})

	// Create request
	req := httptest.NewRequest("GET", "/api/v1/config", nil)
	w := httptest.NewRecorder()

	// Execute
	plugin.handleConfig(w, req)

	// Assert
	resp := w.Result()
	assert.Equal(t, http.StatusOK, resp.StatusCode)
	assert.Equal(t, "application/json", resp.Header.Get("Content-Type"))

	body, _ := io.ReadAll(resp.Body)
	assert.Contains(t, string(body), "max_duration")
	assert.Contains(t, string(body), "audio_format")
	assert.Contains(t, string(body), "enable_waveform")
}

func TestHandleUpload_MethodNotAllowed(t *testing.T) {
	// Setup
	api := &plugintest.API{}
	plugin := &Plugin{}
	plugin.SetAPI(api)

	// Create GET request (should fail)
	req := httptest.NewRequest("GET", "/api/v1/upload", nil)
	w := httptest.NewRecorder()

	// Execute
	plugin.handleUpload(w, req)

	// Assert
	resp := w.Result()
	assert.Equal(t, http.StatusMethodNotAllowed, resp.StatusCode)
}

func TestHandleUpload_Unauthorized(t *testing.T) {
	// Setup
	api := &plugintest.API{}
	plugin := &Plugin{}
	plugin.SetAPI(api)

	// Create request without user ID
	req := httptest.NewRequest("POST", "/api/v1/upload", nil)
	w := httptest.NewRecorder()

	// Execute
	plugin.handleUpload(w, req)

	// Assert
	resp := w.Result()
	assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
}

func TestHandleUpload_MissingChannelID(t *testing.T) {
	// Setup
	api := &plugintest.API{}
	plugin := &Plugin{}
	plugin.SetAPI(api)

	// Create multipart request without channel_id
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	writer.Close()

	req := httptest.NewRequest("POST", "/api/v1/upload", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("Mattermost-User-Id", "user123")
	w := httptest.NewRecorder()

	// Execute
	plugin.handleUpload(w, req)

	// Assert
	resp := w.Result()
	assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
}

func TestExecuteCommand_Voice(t *testing.T) {
	// Setup
	api := &plugintest.API{}
	plugin := &Plugin{}
	plugin.SetAPI(api)

	// Mock expectations
	api.On("SendEphemeralPost", "user123", mock.AnythingOfType("*model.Post")).Return(nil)
	api.On("PublishWebSocketEvent", "open_voice_recorder", mock.Anything, mock.Anything).Return()

	// Create command args
	args := &model.CommandArgs{
		Command:   "/voice",
		UserId:    "user123",
		ChannelId: "channel123",
	}

	// Execute
	resp, err := plugin.ExecuteCommand(nil, args)

	// Assert
	assert.Nil(t, err)
	assert.NotNil(t, resp)
	api.AssertCalled(t, "SendEphemeralPost", "user123", mock.AnythingOfType("*model.Post"))
	api.AssertCalled(t, "PublishWebSocketEvent", "open_voice_recorder", mock.Anything, mock.Anything)
}

func TestConfiguration(t *testing.T) {
	// Test Clone
	original := &configuration{
		MaxDuration:    300,
		AudioFormat:    "webm",
		EnableWaveform: true,
	}

	cloned := original.Clone()
	assert.Equal(t, original.MaxDuration, cloned.MaxDuration)
	assert.Equal(t, original.AudioFormat, cloned.AudioFormat)
	assert.Equal(t, original.EnableWaveform, cloned.EnableWaveform)

	// Modify clone shouldn't affect original
	cloned.MaxDuration = 600
	assert.NotEqual(t, original.MaxDuration, cloned.MaxDuration)
}

func TestGetConfiguration_Default(t *testing.T) {
	plugin := &Plugin{}

	config := plugin.getConfiguration()

	assert.NotNil(t, config)
	assert.Equal(t, 300, config.MaxDuration)
	assert.Equal(t, "webm", config.AudioFormat)
	assert.Equal(t, true, config.EnableWaveform)
}
