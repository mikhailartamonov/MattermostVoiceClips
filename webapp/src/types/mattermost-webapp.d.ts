export interface Channel {
    id: string;
    name: string;
    team_id: string;
    type: string;
}

export interface PluginRegistry {
    registerPostTypeComponent(typeName: string, component: React.ElementType): void;
    registerChannelHeaderButtonAction(
        icon: JSX.Element,
        action: () => void,
        dropdownText: string,
        tooltipText: string
    ): void;
    registerWebSocketEventHandler(event: string, handler: (msg: any) => void): void;

    // Available since Mattermost 7.0 — registers an icon on the right-edge
    // vertical App Bar. Optional so the plugin still loads on older servers;
    // the call site guards with `if (registry.registerAppBarComponent)`.
    registerAppBarComponent?(
        iconURL: string,
        action: (channel: Channel | null) => void,
        tooltipText: React.ReactNode
    ): string;
}

export interface Post {
    id: string;
    create_at: number;
    update_at: number;
    delete_at: number;
    user_id: string;
    channel_id: string;
    message: string;
    type: string;
    props: {
        voice_clip?: {
            duration: number;
            format: string;
        };
        [key: string]: any;
    };
    file_ids: string[];
}

export interface FileInfo {
    id: string;
    name: string;
    extension: string;
    size: number;
    mime_type: string;
}
