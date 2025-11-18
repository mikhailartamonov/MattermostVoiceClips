import {Store} from 'redux';
import VoiceRecorderButton from './components/voice_recorder_button';

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
}

class Plugin {
    public async initialize(registry: PluginRegistry, store: Store) {
        // Register voice recorder button in channel header
        registry.registerChannelHeaderButtonAction(
            <i className="icon icon-microphone" style={{fontSize: '18px'}} />,
            () => {
                // This will be handled by the VoiceRecorderButton component
                const event = new CustomEvent('open-voice-recorder');
                window.dispatchEvent(event);
            },
            'Voice Message',
            'Record a voice message'
        );

        // Register custom post type for voice clips
        registry.registerPostTypeComponent('custom_voice_clip', VoiceRecorderButton);
    }

    public uninitialize() {
        // No cleanup needed
    }
}

// @ts-ignore
window.registerPlugin('com.mattermost.voice-clips', new Plugin());
