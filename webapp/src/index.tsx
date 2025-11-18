import React from 'react';
import {Store} from 'redux';
import VoiceRecorderButton from './components/voice_recorder_button';
import VoiceClipPlayer from './components/voice_clip_player';
import VideoRecorderButton from './components/video_recorder_button';
import VideoClipPlayer from './components/video_clip_player';
import {initI18n, t} from './i18n/translations';
import {playVoiceMessageSound, playVideoMessageSound} from './utils/notification_sound';

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
}

// Combined component for root registration
const RecordersRoot: React.FC = () => (
    <>
        <VoiceRecorderButton />
        <VideoRecorderButton />
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
