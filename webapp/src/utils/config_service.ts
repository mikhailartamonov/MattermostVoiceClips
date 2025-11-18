/**
 * Plugin Configuration Service
 * Fetches and caches plugin settings from the server
 */

export interface PluginConfig {
    // Audio settings
    max_duration: number;
    audio_format: string;
    enable_waveform: boolean;
    max_audio_file_size: number;
    audio_bitrate: number;

    // Video settings
    max_video_duration: number;
    video_format: string;
    max_video_file_size: number;
    video_bitrate: number;

    // Allowed formats
    allowed_audio_formats: string;
    allowed_video_formats: string;
}

// Default configuration
const defaultConfig: PluginConfig = {
    max_duration: 300,
    audio_format: 'webm',
    enable_waveform: true,
    max_audio_file_size: 50,
    audio_bitrate: 128,
    max_video_duration: 120,
    video_format: 'webm',
    max_video_file_size: 100,
    video_bitrate: 1500,
    allowed_audio_formats: 'webm,ogg,mp4,m4a,mp3,aac,wav',
    allowed_video_formats: 'webm,mp4,mov',
};

// Cached configuration
let cachedConfig: PluginConfig | null = null;
let configPromise: Promise<PluginConfig> | null = null;

/**
 * Fetch plugin configuration from server
 */
export async function fetchPluginConfig(): Promise<PluginConfig> {
    // Return cached config if available
    if (cachedConfig) {
        return cachedConfig;
    }

    // Return existing promise if fetch is in progress
    if (configPromise) {
        return configPromise;
    }

    // Start fetch
    configPromise = (async () => {
        try {
            const response = await fetch('/plugins/com.mattermost.voice-clips/api/v1/config', {
                method: 'GET',
                credentials: 'same-origin',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch config');
            }

            const config = await response.json();
            cachedConfig = {...defaultConfig, ...config};
            return cachedConfig;
        } catch (err) {
            // Return default config on error
            cachedConfig = defaultConfig;
            return cachedConfig;
        } finally {
            configPromise = null;
        }
    })();

    return configPromise;
}

/**
 * Get cached configuration (sync)
 * Returns default if not yet fetched
 */
export function getPluginConfig(): PluginConfig {
    return cachedConfig || defaultConfig;
}

/**
 * Clear cached configuration
 * Call this when settings might have changed
 */
export function clearConfigCache(): void {
    cachedConfig = null;
    configPromise = null;
}

/**
 * Get audio bitrate in bps from config
 */
export function getAudioBitrate(): number {
    const config = getPluginConfig();
    return config.audio_bitrate * 1000; // Convert kbps to bps
}

/**
 * Get video bitrate in bps from config
 */
export function getVideoBitrate(): number {
    const config = getPluginConfig();
    return config.video_bitrate * 1000; // Convert kbps to bps
}

/**
 * Get max duration for audio in seconds
 */
export function getMaxAudioDuration(): number {
    return getPluginConfig().max_duration;
}

/**
 * Get max duration for video in seconds
 */
export function getMaxVideoDuration(): number {
    return getPluginConfig().max_video_duration;
}
