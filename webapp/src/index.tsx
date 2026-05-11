import React from 'react';
import {Store} from 'redux';
import VoiceRecorderButton from './components/voice_recorder_button';
import VoiceClipPlayer from './components/voice_clip_player';
import VideoRecorderButton from './components/video_recorder_button';
import VideoClipPlayer from './components/video_clip_player';
import RecorderChooser from './components/recorder_chooser';
import {initI18n, t} from './i18n/translations';
import {playVoiceMessageSound, playVideoMessageSound} from './utils/notification_sound';

// Inlined SVG for the App Bar icon. Using a data: URI avoids needing a
// static-file route on the server side. fill="currentColor" lets the icon
// adopt Mattermost's App Bar foreground color so it looks right in both
// light and dark themes.
const APP_BAR_ICON_URL = 'data:image/svg+xml;base64,' + btoa(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">' +
    '<path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>' +
    '<path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>' +
    '</svg>',
);

interface AppBarChannel {
    id: string;
    name?: string;
    team_id?: string;
    type?: string;
}

// PluginRegistry is injected by Mattermost
interface PluginRegistry {
    registerChannelHeaderButtonAction: (
        icon: JSX.Element,
        action: () => void,
        dropdownText: string,
        tooltipText: string
    ) => void;
    registerPostTypeComponent: (typeName: string, component: React.ComponentType<any>) => void;
    registerWebSocketEventHandler: (event: string, handler: (msg: any) => void) => void;
    registerRootComponent?: (component: React.ComponentType<any>) => void;
    // Mattermost 7+ — right-edge App Bar. Optional so older servers still load us.
    registerAppBarComponent?: (
        iconURL: string,
        action: (channel: AppBarChannel | null) => void,
        tooltipText: React.ReactNode
    ) => string;
}

// Combined component for root registration
const RecordersRoot: React.FC = () => (
    <>
        <VoiceRecorderButton />
        <VideoRecorderButton />
        <RecorderChooser />
    </>
);

class Plugin {
    public async initialize(registry: PluginRegistry, store: Store) {
        // Initialize i18n with system language
        initI18n();

        // Register voice recorder button in channel header
        registry.registerChannelHeaderButtonAction(
            <i className="icon icon-microphone" style={{fontSize: '18px'}} />,
            () => {
                const event = new CustomEvent('open-voice-recorder');
                window.dispatchEvent(event);
            },
            t('voiceMessage'),
            t('recordVoiceMessage')
        );

        // Register video recorder button in channel header
        registry.registerChannelHeaderButtonAction(
            <i className="icon icon-video" style={{fontSize: '18px'}} />,
            () => {
                const event = new CustomEvent('open-video-recorder');
                window.dispatchEvent(event);
            },
            t('videoMessage'),
            t('recordVideoMessage')
        );

        // Register App Bar entry (right vertical strip, Mattermost 7+).
        // Optional — older servers don't expose this method, so guard it.
        // Clicking the App Bar icon opens our chooser modal, which then
        // dispatches the existing open-voice-recorder / open-video-recorder
        // events with the channel id threaded through.
        if (registry.registerAppBarComponent) {
            registry.registerAppBarComponent(
                APP_BAR_ICON_URL,
                (channel) => {
                    window.dispatchEvent(new CustomEvent('open-recorder-chooser', {
                        detail: {channelId: channel?.id},
                    }));
                },
                t('voiceMessage') + ' / ' + t('videoMessage'),
            );
        }

        // Listen for new posts to play notification sounds
        registry.registerWebSocketEventHandler(
            'posted',
            (msg: any) => {
                try {
                    const post = JSON.parse(msg.data.post);
                    const currentUserId = store.getState().entities.users.currentUserId;

                    // Don't play sound for own messages
                    if (post.user_id === currentUserId) {
                        return;
                    }

                    // Play appropriate notification sound
                    if (post.type === 'custom_voice_clip') {
                        playVoiceMessageSound();
                    } else if (post.type === 'custom_video_clip') {
                        playVideoMessageSound();
                    }
                } catch (err) {
                    // Ignore parsing errors
                }
            }
        );

        // Register custom post types
        registry.registerPostTypeComponent('custom_voice_clip', VoiceClipPlayer);
        registry.registerPostTypeComponent('custom_video_clip', VideoClipPlayer);

        // Register recorders as root components (always available)
        if (registry.registerRootComponent) {
            registry.registerRootComponent(RecordersRoot);
        }

        // Listen for WebSocket events from /voice command
        registry.registerWebSocketEventHandler(
            'custom_com.mattermost.voice-clips_open_voice_recorder',
            (event: any) => {
                const customEvent = new CustomEvent('open-voice-recorder', {
                    detail: event.data,
                });
                window.dispatchEvent(customEvent);
            }
        );

        // Listen for WebSocket events from /video command
        registry.registerWebSocketEventHandler(
            'custom_com.mattermost.voice-clips_open_video_recorder',
            (event: any) => {
                const customEvent = new CustomEvent('open-video-recorder', {
                    detail: event.data,
                });
                window.dispatchEvent(customEvent);
            }
        );

        // Also listen for non-prefixed events (for compatibility)
        registry.registerWebSocketEventHandler(
            'open_voice_recorder',
            (event: any) => {
                const customEvent = new CustomEvent('open-voice-recorder', {
                    detail: event.data,
                });
                window.dispatchEvent(customEvent);
            }
        );

        registry.registerWebSocketEventHandler(
            'open_video_recorder',
            (event: any) => {
                const customEvent = new CustomEvent('open-video-recorder', {
                    detail: event.data,
                });
                window.dispatchEvent(customEvent);
            }
        );
    }

    public uninitialize() {
        // No cleanup needed
    }
}

// @ts-ignore
window.registerPlugin('com.mattermost.voice-clips', new Plugin());
