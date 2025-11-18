package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/mattermost/mattermost/server/public/model"
	"github.com/mattermost/mattermost/server/public/plugin"
	"github.com/mattermost/mattermost/server/public/pluginapi"
)

// Plugin implements the interface expected by the Mattermost server to communicate between the server and plugin processes.
type Plugin struct {
	plugin.MattermostPlugin

	// configurationLock synchronizes access to the configuration.
	configurationLock sync.RWMutex

	// configuration is the active plugin configuration. Consult getConfiguration and
	// setConfiguration for usage.
	configuration *configuration

	client *pluginapi.Client
}

// ServeHTTP demonstrates a plugin that handles HTTP requests
func (p *Plugin) ServeHTTP(c *plugin.Context, w http.ResponseWriter, r *http.Request) {
	switch r.URL.Path {
	case "/api/v1/upload":
		p.handleUpload(w, r)
	case "/api/v1/config":
		p.handleConfig(w, r)
	default:
		http.NotFound(w, r)
	}
}

// handleUpload handles voice clip upload
func (p *Plugin) handleUpload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := r.Header.Get("Mattermost-User-Id")
	if userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse multipart form
	err := r.ParseMultipartForm(32 << 20) // 32 MB max
	if err != nil {
		http.Error(w, "Failed to parse form", http.StatusBadRequest)
		return
	}

	channelID := r.FormValue("channel_id")
	if channelID == "" {
		http.Error(w, "channel_id is required", http.StatusBadRequest)
		return
	}

	// Get the file from form
	file, handler, err := r.FormFile("audio")
	if err != nil {
		http.Error(w, "Failed to get audio file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Read file data
	data, err := io.ReadAll(file)
	if err != nil {
		http.Error(w, "Failed to read file", http.StatusInternalServerError)
		return
	}

	// Determine file extension and mime type based on format
	extension := filepath.Ext(handler.Filename)
	if extension == "" {
		extension = ".webm" // default
	}

	mimeType := "audio/webm"
	if strings.HasSuffix(extension, ".mp4") || strings.HasSuffix(extension, ".m4a") {
		mimeType = "audio/mp4"
	} else if strings.HasSuffix(extension, ".ogg") {
		mimeType = "audio/ogg"
	}

	// Generate filename with timestamp
	timestamp := time.Now().Unix()
	filename := fmt.Sprintf("voice_clip_%d%s", timestamp, extension)

	// Upload file to Mattermost
	fileInfo, appErr := p.API.UploadFile(data, channelID, filename)
	if appErr != nil {
		p.API.LogError("Failed to upload file", "error", appErr.Error())
		http.Error(w, "Failed to upload file: "+appErr.Error(), http.StatusInternalServerError)
		return
	}

	// Get duration from form if provided
	durationStr := r.FormValue("duration")
	duration := 0
	if durationStr != "" {
		duration, _ = strconv.Atoi(durationStr)
	}

	// Create post with the audio file
	post := &model.Post{
		UserId:    userID,
		ChannelId: channelID,
		Message:   "🎤 Voice message",
		FileIds:   []string{fileInfo.Id},
		Type:      "custom_voice_clip",
		Props: map[string]interface{}{
			"voice_clip": map[string]interface{}{
				"duration": duration,
				"format":   extension,
			},
		},
	}

	createdPost, appErr := p.API.CreatePost(post)
	if appErr != nil {
		p.API.LogError("Failed to create post", "error", appErr.Error())
		http.Error(w, "Failed to create post: "+appErr.Error(), http.StatusInternalServerError)
		return
	}

	// Return success response
	response := map[string]interface{}{
		"post_id": createdPost.Id,
		"file_id": fileInfo.Id,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// handleConfig returns plugin configuration
func (p *Plugin) handleConfig(w http.ResponseWriter, r *http.Request) {
	config := p.getConfiguration()

	response := map[string]interface{}{
		"max_duration":   config.MaxDuration,
		"audio_format":   config.AudioFormat,
		"enable_waveform": config.EnableWaveform,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// OnActivate is called when the plugin is activated
func (p *Plugin) OnActivate() error {
	p.client = pluginapi.NewClient(p.API, p.Driver)
	p.API.LogInfo("Voice Clips plugin activated")
	return nil
}

// OnDeactivate is called when the plugin is deactivated
func (p *Plugin) OnDeactivate() error {
	p.API.LogInfo("Voice Clips plugin deactivated")
	return nil
}
