package main

import (
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
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

	// Determine if this is audio or video
	mediaType := r.FormValue("type")
	isVideo := mediaType == "video"

	// Get the file from form
	var file multipart.File
	var handler *multipart.FileHeader
	var err error

	if isVideo {
		file, handler, err = r.FormFile("video")
	} else {
		file, handler, err = r.FormFile("audio")
	}

	if err != nil {
		http.Error(w, "Failed to get media file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Read file data
	data, err := io.ReadAll(file)
	if err != nil {
		http.Error(w, "Failed to read file", http.StatusInternalServerError)
		return
	}

	// Validate file size (max 100 MB for video, 50 MB for audio)
	config := p.getConfiguration()
	maxFileSize := int64(50 * 1024 * 1024) // 50 MB
	if isVideo {
		maxFileSize = 100 * 1024 * 1024 // 100 MB for video
	}
	if int64(len(data)) > maxFileSize {
		http.Error(w, fmt.Sprintf("File size exceeds maximum allowed (%d MB)", maxFileSize/(1024*1024)), http.StatusRequestEntityTooLarge)
		return
	}

	// Validate minimum file size (at least 1 KB to prevent empty files)
	if len(data) < 1024 {
		http.Error(w, "File is too small or empty", http.StatusBadRequest)
		return
	}

	// Determine file extension and mime type based on format
	extension := filepath.Ext(handler.Filename)
	if extension == "" {
		if isVideo {
			extension = ".webm"
		} else {
			extension = ".webm"
		}
	}

	// Validate file extension
	var allowedExtensions map[string]string
	if isVideo {
		allowedExtensions = map[string]string{
			".webm": "video/webm",
			".mp4":  "video/mp4",
			".mov":  "video/quicktime",
		}
	} else {
		allowedExtensions = map[string]string{
			".webm": "audio/webm",
			".ogg":  "audio/ogg",
			".mp4":  "audio/mp4",
			".m4a":  "audio/mp4",
			".wav":  "audio/wav",
		}
	}

	_, validExtension := allowedExtensions[strings.ToLower(extension)]
	if !validExtension {
		if isVideo {
			http.Error(w, "Invalid video file format. Allowed: webm, mp4, mov", http.StatusBadRequest)
		} else {
			http.Error(w, "Invalid audio file format. Allowed: webm, ogg, mp4, m4a, wav", http.StatusBadRequest)
		}
		return
	}

	// Validate MIME type from file header (magic numbers)
	if !isValidMediaFile(data, extension, isVideo) {
		http.Error(w, "File content does not match expected format", http.StatusBadRequest)
		return
	}

	// Validate channel access
	if !p.API.HasPermissionToChannel(userID, channelID, model.PermissionCreatePost) {
		http.Error(w, "No permission to post in this channel", http.StatusForbidden)
		return
	}

	// Validate duration
	durationStr := r.FormValue("duration")
	duration := 0
	if durationStr != "" {
		duration, _ = strconv.Atoi(durationStr)
		// Validate against max duration from config
		if duration > config.MaxDuration {
			http.Error(w, fmt.Sprintf("Duration exceeds maximum allowed (%d seconds)", config.MaxDuration), http.StatusBadRequest)
			return
		}
	}

	// Generate filename with timestamp
	timestamp := time.Now().Unix()
	var filename string
	if isVideo {
		filename = fmt.Sprintf("video_clip_%d%s", timestamp, extension)
	} else {
		filename = fmt.Sprintf("voice_clip_%d%s", timestamp, extension)
	}

	// Upload file to Mattermost
	fileInfo, appErr := p.API.UploadFile(data, channelID, filename)
	if appErr != nil {
		p.API.LogError("Failed to upload file", "error", appErr.Error())
		http.Error(w, "Failed to upload file: "+appErr.Error(), http.StatusInternalServerError)
		return
	}

	// Create post with the media file
	var post *model.Post
	if isVideo {
		post = &model.Post{
			UserId:    userID,
			ChannelId: channelID,
			Message:   "📹 Video message",
			FileIds:   []string{fileInfo.Id},
			Type:      "custom_video_clip",
			Props: map[string]interface{}{
				"video_clip": map[string]interface{}{
					"duration": duration,
					"format":   extension,
				},
			},
		}
	} else {
		post = &model.Post{
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

	// Register slash commands
	if err := p.registerCommands(); err != nil {
		return err
	}

	p.API.LogInfo("Voice Clips plugin activated")
	return nil
}

// registerCommands registers /voice and /video slash commands
func (p *Plugin) registerCommands() error {
	// Register /voice command
	if err := p.API.RegisterCommand(&model.Command{
		Trigger:          "voice",
		DisplayName:      "Voice Message",
		Description:      "Record and send a voice message",
		AutoComplete:     true,
		AutoCompleteDesc: "Open voice message recorder",
		AutoCompleteHint: "",
	}); err != nil {
		return err
	}

	// Register /video command
	return p.API.RegisterCommand(&model.Command{
		Trigger:          "video",
		DisplayName:      "Video Message",
		Description:      "Record and send a video message",
		AutoComplete:     true,
		AutoCompleteDesc: "Open video message recorder",
		AutoCompleteHint: "",
	})
}

// ExecuteCommand handles the /voice and /video commands
func (p *Plugin) ExecuteCommand(c *plugin.Context, args *model.CommandArgs) (*model.CommandResponse, *model.AppError) {
	switch args.Command {
	case "/voice":
		post := &model.Post{
			UserId:    args.UserId,
			ChannelId: args.ChannelId,
			Message:   "🎤 Click the microphone button in the channel header to record a voice message, or wait for the recorder to open automatically.",
		}
		p.API.SendEphemeralPost(args.UserId, post)

		p.API.PublishWebSocketEvent("open_voice_recorder", map[string]interface{}{
			"channel_id": args.ChannelId,
		}, &model.WebsocketBroadcast{
			UserId: args.UserId,
		})

	case "/video":
		post := &model.Post{
			UserId:    args.UserId,
			ChannelId: args.ChannelId,
			Message:   "📹 Click the video button in the channel header to record a video message, or wait for the recorder to open automatically.",
		}
		p.API.SendEphemeralPost(args.UserId, post)

		p.API.PublishWebSocketEvent("open_video_recorder", map[string]interface{}{
			"channel_id": args.ChannelId,
		}, &model.WebsocketBroadcast{
			UserId: args.UserId,
		})
	}

	return &model.CommandResponse{}, nil
}

// OnDeactivate is called when the plugin is deactivated
func (p *Plugin) OnDeactivate() error {
	p.API.LogInfo("Voice Clips plugin deactivated")
	return nil
}

// isValidMediaFile checks if the file content matches expected audio/video file signatures
func isValidMediaFile(data []byte, extension string, isVideo bool) bool {
	if len(data) < 12 {
		return false
	}

	// Check magic numbers (file signatures)
	switch strings.ToLower(extension) {
	case ".webm":
		// WebM starts with 0x1A 0x45 0xDF 0xA3 (EBML)
		return data[0] == 0x1A && data[1] == 0x45 && data[2] == 0xDF && data[3] == 0xA3
	case ".ogg":
		// OGG starts with "OggS"
		return string(data[0:4]) == "OggS"
	case ".mp4", ".m4a", ".mov":
		// MP4/M4A/MOV has "ftyp" at offset 4
		if len(data) < 8 {
			return false
		}
		return string(data[4:8]) == "ftyp"
	case ".wav":
		// WAV starts with "RIFF" and has "WAVE" at offset 8
		if len(data) < 12 {
			return false
		}
		return string(data[0:4]) == "RIFF" && string(data[8:12]) == "WAVE"
	}

	// If we can't validate, allow it (be permissive for unknown formats)
	return true
}
