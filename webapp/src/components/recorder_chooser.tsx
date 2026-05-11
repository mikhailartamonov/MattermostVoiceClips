import React, {useEffect, useState} from 'react';
import {t} from '../i18n/translations';

/**
 * RecorderChooser is the small modal that appears when the user clicks the
 * App Bar icon. It offers a choice between a voice clip and a video clip,
 * then hands off to the existing recorder by dispatching the same
 * CustomEvent that the channel-header buttons already use — with the
 * channel id threaded through so uploads target the right channel.
 */
const RecorderChooser: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [channelId, setChannelId] = useState<string | null>(null);

    useEffect(() => {
        const handleOpen = (event: Event) => {
            const detail = (event as CustomEvent).detail as {channelId?: string} | undefined;
            setChannelId(detail?.channelId ?? null);
            setIsOpen(true);
        };

        window.addEventListener('open-recorder-chooser', handleOpen);
        return () => {
            window.removeEventListener('open-recorder-chooser', handleOpen);
        };
    }, []);

    const close = () => {
        setIsOpen(false);
        setChannelId(null);
    };

    const pick = (mode: 'voice' | 'video') => {
        const eventName = mode === 'voice' ? 'open-voice-recorder' : 'open-video-recorder';
        window.dispatchEvent(new CustomEvent(eventName, {
            detail: {channelId},
        }));
        close();
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div
            className='voice-clips-recorder-chooser'
            style={modalStyle}
            onClick={close}
        >
            <div
                className='voice-clips-recorder-chooser-content'
                style={contentStyle}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={headerStyle}>
                    <h3 style={titleStyle}>{t('voiceMessage')} / {t('videoMessage')}</h3>
                    <button
                        onClick={close}
                        style={closeButtonStyle}
                        aria-label={t('cancel')}
                    >{'✕'}</button>
                </div>
                <div style={bodyStyle}>
                    <button
                        onClick={() => pick('voice')}
                        style={{...optionButtonStyle, ...voiceButtonStyle}}
                    >
                        <span style={iconStyle}>{'🎤'}</span>
                        <span>{t('recordVoiceMessage')}</span>
                    </button>
                    <button
                        onClick={() => pick('video')}
                        style={{...optionButtonStyle, ...videoButtonStyle}}
                    >
                        <span style={iconStyle}>{'📹'}</span>
                        <span>{t('recordVideoMessage')}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const modalStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
};

const contentStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '0',
    minWidth: '320px',
    maxWidth: '90%',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};

const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #ddd',
};

const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
};

const closeButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#666',
    lineHeight: 1,
};

const bodyStyle: React.CSSProperties = {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
};

const optionButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 20px',
    fontSize: '16px',
    fontWeight: 500,
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    color: 'white',
    textAlign: 'left',
    transition: 'opacity 0.15s',
};

const voiceButtonStyle: React.CSSProperties = {
    backgroundColor: '#1976d2',
};

const videoButtonStyle: React.CSSProperties = {
    backgroundColor: '#388e3c',
};

const iconStyle: React.CSSProperties = {
    fontSize: '22px',
};

export default RecorderChooser;
