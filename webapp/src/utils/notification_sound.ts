/**
 * Notification Sound System
 * Plays a fun cartoon "pulk" sound when voice/video messages arrive
 */

let audioContext: AudioContext | null = null;

/**
 * Get or create AudioContext
 */
function getAudioContext(): AudioContext {
    if (!audioContext || audioContext.state === 'closed') {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContext = new AudioContextClass();
    }
    return audioContext;
}

/**
 * Play a cartoon "pulk" pop sound
 * Creates a fun, bouncy notification sound
 */
export function playNotificationSound(): void {
    try {
        const ctx = getAudioContext();

        // Resume context if suspended (browser autoplay policy)
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const now = ctx.currentTime;

        // Create oscillators for the "pulk" sound
        // Main tone - starts high and drops quickly (cartoon pop)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, now); // Start at A5
        osc1.frequency.exponentialRampToValueAtTime(220, now + 0.1); // Drop to A3

        gain1.gain.setValueAtTime(0.3, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc1.connect(gain1);
        gain1.connect(ctx.destination);

        osc1.start(now);
        osc1.stop(now + 0.15);

        // Second tone - higher harmonic for "brightness"
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1320, now); // E6
        osc2.frequency.exponentialRampToValueAtTime(440, now + 0.08);

        gain2.gain.setValueAtTime(0.15, now);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        osc2.start(now);
        osc2.stop(now + 0.1);

        // Third tone - subtle bounce back up
        const osc3 = ctx.createOscillator();
        const gain3 = ctx.createGain();

        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(330, now + 0.12);
        osc3.frequency.exponentialRampToValueAtTime(440, now + 0.18);

        gain3.gain.setValueAtTime(0.1, now + 0.12);
        gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        osc3.connect(gain3);
        gain3.connect(ctx.destination);

        osc3.start(now + 0.12);
        osc3.stop(now + 0.2);

    } catch (err) {
        // Silently fail if audio not available
    }
}

/**
 * Play sound for voice message notification
 */
export function playVoiceMessageSound(): void {
    playNotificationSound();
}

/**
 * Play sound for video message notification
 */
export function playVideoMessageSound(): void {
    // Slightly different sound for video - two quick pulks
    try {
        const ctx = getAudioContext();

        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const now = ctx.currentTime;

        // First pulk
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(660, now);
        osc1.frequency.exponentialRampToValueAtTime(330, now + 0.08);

        gain1.gain.setValueAtTime(0.25, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc1.connect(gain1);
        gain1.connect(ctx.destination);

        osc1.start(now);
        osc1.stop(now + 0.1);

        // Second pulk (higher)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, now + 0.12);
        osc2.frequency.exponentialRampToValueAtTime(440, now + 0.2);

        gain2.gain.setValueAtTime(0.25, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        osc2.start(now + 0.12);
        osc2.stop(now + 0.22);

    } catch (err) {
        // Silently fail if audio not available
    }
}
