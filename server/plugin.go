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

	config := p.getConfiguration()

	// Compute the upload cap from config so ParseMultipartForm doesn't reject
	// a payload that we'd otherwise accept. Cap is sized to the larger of the
	// configured audio/video maxima with a small headroom for multipart envelope.
	maxAudio := int64(config.MaxAudioFileSize) * 1024 * 1024
	if maxAudio <= 0 {
		maxAudio = 50 * 1024 * 1024
	}
	maxVideo := int64(config.MaxVideoFileSize) * 1024 * 1024
	if maxVideo <= 0 {
		maxVideo = 100 * 1024 * 1024
	}
	uploadCap := maxAudio
	if maxVideo > uploadCap {
		uploadCap = maxVideo
	}
	uploadCap += 4 << 20 // 4 MB headroom for form fields + boundaries

	// Reject the request body early so a hostile peer can't make us read
	// gigabytes into memory before the size check below fires.
	r.Body = http.MaxBytesReader(w, r.Body, uploadCap)

	err := r.ParseMultipartForm(uploadCap)
	if err != nil {
		http.Error(w, "Failed to parse form (payload too large?)", http.StatusBadRequest)
		return
	}

	channelID := r.FormValue("channel_id")
	if channelID == "" {
		http.Error(w, "channel_id is required", http.StatusBadRequest)
		return
	}

	// Authorize *before* we read the file body.
	if !p.API.HasPermissionToChannel(userID, channelID, model.PermissionCreatePost) {
		http.Error(w, "No permission to post in this channel", http.StatusForbidden)
		return
	}

	// Channel-level kill switch. Toggled by channel admins via /voice-clips.
	if p.isChannelDisabled(channelID) {
		http.Error(w, "Voice and video clips are disabled in this channel", http.StatusForbidden)
		return
	}

	// Determine if this is audio or video
	mediaType := r.FormValue("type")
	isVideo := mediaType == "video"

	// Get the file from form
	var file multipart.File
	var handler *multipart.FileHeader

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

	// Validate file size using config
	var maxFileSize int64
	if isVideo {
		maxFileSize = maxVideo
	} else {
		maxFileSize = maxAudio
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

	// Determine file extension based on uploaded filename, defaulting to webm.
	extension := filepath.Ext(handler.Filename)
	if extension == "" {
		extension = ".webm"
	}

	// Validate file extension using config
	var allowedFormats string
	if isVideo {
		allowedFormats = config.AllowedVideoFormats
		if allowedFormats == "" {
			allowedFormats = "webm,mp4,mov"
		}
	} else {
		allowedFormats = config.AllowedAudioFormats
		if allowedFormats == "" {
			allowedFormats = "webm,ogg,mp4,m4a,mp3,aac,wav"
		}
	}

	// Parse allowed formats from config
	allowedList := strings.Split(allowedFormats, ",")
	allowedExtensions := make(map[string]bool)
	for _, ext := range allowedList {
		ext = strings.TrimSpace(ext)
		if ext != "" {
			allowedExtensions["."+ext] = true
		}
	}

	if !allowedExtensions[strings.ToLower(extension)] {
		if isVideo {
			http.Error(w, fmt.Sprintf("Invalid video file format. Allowed: %s", allowedFormats), http.StatusBadRequest)
		} else {
			http.Error(w, fmt.Sprintf("Invalid audio file format. Allowed: %s", allowedFormats), http.StatusBadRequest)
		}
		return
	}

	// Validate MIME type from file header (magic numbers)
	if !isValidMediaFile(data, extension, isVideo) {
		http.Error(w, "File content does not match expected format", http.StatusBadRequest)
		return
	}

	// Validate duration
	durationStr := r.FormValue("duration")
	duration := 0
	if durationStr != "" {
		var parseErr error
		duration, parseErr = strconv.Atoi(durationStr)
		if parseErr != nil {
			p.API.LogWarn("Invalid duration format", "duration", durationStr, "error", parseErr.Error())
			duration = 0
		}
		// Validate against max duration from config (separate for audio and video)
		var maxDuration int
		if isVideo {
			maxDuration = config.MaxVideoDuration
			if maxDuration == 0 {
				maxDuration = 120 // Default 2 minutes for video
			}
		} else {
			maxDuration = config.MaxDuration
			if maxDuration == 0 {
				maxDuration = 300 // Default 5 minutes for audio
			}
		}
		if duration > maxDuration {
			http.Error(w, fmt.Sprintf("Duration exceeds maximum allowed (%d seconds)", maxDuration), http.StatusBadRequest)
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

	// Build the post. Message is intentionally empty: the custom post type
	// (custom_voice_clip / custom_video_clip) is rendered entirely by the
	// webapp, which already shows a localized header above the player.
	var post *model.Post
	if isVideo {
		post = &model.Post{
			UserId:    userID,
			ChannelId: channelID,
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
		// CreatePost failed after UploadFile succeeded — the file is now
		// orphaned in the Mattermost file store. Mattermost's plugin API
		// does not expose file deletion, so log loudly so admins can audit.
		p.API.LogError("Failed to create post; uploaded file is now orphaned",
			"file_id", fileInfo.Id, "channel_id", channelID, "user_id", userID, "error", appErr.Error())
		http.Error(w, "Failed to create post: "+appErr.Error(), http.StatusInternalServerError)
		return
	}

	// Return success response
	response := map[string]interface{}{
		"post_id": createdPost.Id,
		"file_id": fileInfo.Id,
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(response)
}

// handleConfig returns plugin configuration
func (p *Plugin) handleConfig(w http.ResponseWriter, r *http.Request) {
	// Require an authenticated Mattermost user. The config doesn't contain
	// secrets, but exposing it to anonymous callers is unnecessary.
	if r.Header.Get("Mattermost-User-Id") == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	config := p.getConfiguration()

	response := map[string]interface{}{
		// Audio settings
		"max_duration":        config.MaxDuration,
		"audio_format":        config.AudioFormat,
		"enable_waveform":     config.EnableWaveform,
		"max_audio_file_size": config.MaxAudioFileSize,
		"audio_bitrate":       config.AudioBitrate,

		// Video settings
		"max_video_duration":  config.MaxVideoDuration,
		"video_format":        config.VideoFormat,
		"max_video_file_size": config.MaxVideoFileSize,
		"video_bitrate":       config.VideoBitrate,

		// Allowed formats
		"allowed_audio_formats": config.AllowedAudioFormats,
		"allowed_video_formats": config.AllowedVideoFormats,
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(response)
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

// kvChannelDisabledPrefix is the KV key prefix marking channels where clips are turned off.
// A non-empty value at "voice-clips-disabled:<channelID>" means recording is blocked.
const kvChannelDisabledPrefix = "voice-clips-disabled:"

// isChannelDisabled reports whether voice/video clips are turned off in the given channel.
func (p *Plugin) isChannelDisabled(channelID string) bool {
	val, err := p.API.KVGet(kvChannelDisabledPrefix + channelID)
	if err != nil {
		// KV read failures are logged but treated as "not disabled" so a
		// transient KV outage doesn't block all uploads.
		p.API.LogWarn("Failed to read per-channel state", "channel_id", channelID, "error", err.Error())
		return false
	}
	return len(val) > 0
}

// setChannelDisabled flips the per-channel toggle.
func (p *Plugin) setChannelDisabled(channelID string, disabled bool) *model.AppError {
	if disabled {
		return p.API.KVSet(kvChannelDisabledPrefix+channelID, []byte("1"))
	}
	return p.API.KVDelete(kvChannelDisabledPrefix + channelID)
}

// registerCommands registers /voice, /video, and /voice-clips slash commands.
func (p *Plugin) registerCommands() error {
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

	if err := p.API.RegisterCommand(&model.Command{
		Trigger:          "video",
		DisplayName:      "Video Message",
		Description:      "Record and send a video message",
		AutoComplete:     true,
		AutoCompleteDesc: "Open video message recorder",
		AutoCompleteHint: "",
	}); err != nil {
		return err
	}

	return p.API.RegisterCommand(&model.Command{
		Trigger:          "voice-clips",
		DisplayName:      "Voice & Video Clips",
		Description:      "Manage Voice & Video Clips for this channel",
		AutoComplete:     true,
		AutoCompleteDesc: "Enable, disable, or check status of clips in this channel",
		AutoCompleteHint: "[enable|disable|status]",
		AutocompleteData: buildVoiceClipsAutocomplete(),
	})
}

// buildVoiceClipsAutocomplete describes the /voice-clips subcommands so users
// get inline suggestions as they type.
func buildVoiceClipsAutocomplete() *model.AutocompleteData {
	root := model.NewAutocompleteData("voice-clips", "[enable|disable|status]", "Manage Voice & Video Clips for this channel")
	root.AddCommand(model.NewAutocompleteData("enable", "", "Allow recording voice and video clips in this channel"))
	root.AddCommand(model.NewAutocompleteData("disable", "", "Disallow recording voice and video clips in this channel"))
	root.AddCommand(model.NewAutocompleteData("status", "", "Show whether clips are enabled in this channel"))
	return root
}

// ExecuteCommand handles /voice, /video, and /voice-clips.
func (p *Plugin) ExecuteCommand(c *plugin.Context, args *model.CommandArgs) (*model.CommandResponse, *model.AppError) {
	fields := strings.Fields(args.Command)
	if len(fields) == 0 {
		return &model.CommandResponse{}, nil
	}

	switch fields[0] {
	case "/voice-clips":
		return p.handleVoiceClipsCommand(args, fields[1:]), nil

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

// handleVoiceClipsCommand runs `/voice-clips <sub>` (enable, disable, status).
// enable/disable require PermissionManageChannelProperties — i.e. channel admins.
// Replies are ephemeral so the rest of the channel doesn't see them.
func (p *Plugin) handleVoiceClipsCommand(args *model.CommandArgs, sub []string) *model.CommandResponse {
	if len(sub) == 0 {
		return ephemeralResponse("Usage: `/voice-clips [enable|disable|status]`")
	}

	switch strings.ToLower(sub[0]) {
	case "enable", "disable":
		if !p.canManageChannel(args.UserId, args.ChannelId) {
			return ephemeralResponse("Only channel administrators can change this setting.")
		}
		disabled := sub[0] == "disable"
		if err := p.setChannelDisabled(args.ChannelId, disabled); err != nil {
			p.API.LogError("Failed to update per-channel state", "channel_id", args.ChannelId, "error", err.Error())
			return ephemeralResponse("Failed to update setting: " + err.Error())
		}
		if disabled {
			return ephemeralResponse("Voice & Video Clips are now **disabled** in this channel. Existing clips remain; new recordings will be refused.")
		}
		return ephemeralResponse("Voice & Video Clips are now **enabled** in this channel.")

	case "status":
		if p.isChannelDisabled(args.ChannelId) {
			return ephemeralResponse("Voice & Video Clips are **disabled** in this channel.")
		}
		return ephemeralResponse("Voice & Video Clips are **enabled** in this channel.")

	default:
		return ephemeralResponse("Usage: `/voice-clips [enable|disable|status]`")
	}
}

// canManageChannel returns true if the user is allowed to change channel-level
// plugin settings for this channel. For public/private channels that means
// holding the channel-admin permission; for DMs and group DMs there is no
// admin concept so any participant qualifies.
func (p *Plugin) canManageChannel(userID, channelID string) bool {
	channel, appErr := p.API.GetChannel(channelID)
	if appErr != nil {
		p.API.LogWarn("Failed to read channel for permission check",
			"channel_id", channelID, "error", appErr.Error())
		return false
	}

	switch channel.Type {
	case model.ChannelTypePrivate:
		return p.API.HasPermissionToChannel(userID, channelID, model.PermissionManagePrivateChannelProperties)
	case model.ChannelTypeDirect, model.ChannelTypeGroup:
		// DM/Group DM: no admin role, any participant who can post may toggle.
		return p.API.HasPermissionToChannel(userID, channelID, model.PermissionCreatePost)
	default:
		return p.API.HasPermissionToChannel(userID, channelID, model.PermissionManagePublicChannelProperties)
	}
}

func ephemeralResponse(text string) *model.CommandResponse {
	return &model.CommandResponse{
		ResponseType: model.CommandResponseTypeEphemeral,
		Text:         text,
	}
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
	case ".mp3":
		// MP3 starts with ID3 tag or frame sync (0xFF 0xFB/0xFA/0xF3/0xF2)
		if string(data[0:3]) == "ID3" {
			return true
		}
		return data[0] == 0xFF && (data[1]&0xE0) == 0xE0
	case ".aac":
		// AAC ADTS starts with 0xFF 0xF1 or 0xFF 0xF9
		return data[0] == 0xFF && (data[1] == 0xF1 || data[1] == 0xF9 || (data[1]&0xF0) == 0xF0)
	}

	// If we can't validate, allow it (be permissive for unknown formats)
	return true
}
