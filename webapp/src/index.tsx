import React from 'react';
import {Store} from 'redux';
import VoiceRecorderButton from './components/voice_recorder_button';
import VoiceClipPlayer from './components/voice_clip_player';
import VideoRecorderButton from './components/video_recorder_button';
import VideoClipPlayer from './components/video_clip_player';

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
        // Register voice recorder button in channel header
        registry.registerChannelHeaderButtonAction(
            <i className="icon icon-microphone" style={{fontSize: '18px'}} />,
            () => {
                const event = new CustomEvent('open-voice-recorder');
                window.dispatchEvent(event);
            },
            'Voice Message',
            'Record a voice message'
        );

        // Register video recorder button in channel header
        registry.registerChannelHeaderButtonAction(
            <i className="icon icon-video" style={{fontSize: '18px'}} />,
            () => {
                const event = new CustomEvent('open-video-recorder');
                window.dispatchEvent(event);
            },
            'Video Message',
            'Record a video message'
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
