import React, {useEffect, useRef} from 'react';

interface WaveformVisualizerProps {
    audioElement: HTMLAudioElement | null;
    isPlaying: boolean;
    width?: number;
    height?: number;
    barColor?: string;
}

const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
    audioElement,
    isPlaying,
    width = 300,
    height = 40,
    barColor = '#1976d2',
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

    useEffect(() => {
        if (!audioElement) return;

        // Create audio context and analyser
        const initAudioContext = () => {
            // Check if already connected to prevent errors
            if (sourceRef.current) {
                return;
            }

            if (!audioContextRef.current) {
                const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                audioContextRef.current = new AudioContext();
            }

            if (!analyserRef.current) {
                const analyser = audioContextRef.current.createAnalyser();
                analyser.fftSize = 256;
                analyserRef.current = analyser;

                try {
                    const source = audioContextRef.current.createMediaElementSource(audioElement);
                    sourceRef.current = source;
                    source.connect(analyser);
                    analyser.connect(audioContextRef.current.destination);
                } catch (err) {
                    // Audio element already connected to another context
                }
            }
        };

        // Initialize on first play
        if (isPlaying && !sourceRef.current) {
            initAudioContext();
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [audioElement, isPlaying]);

    // Cleanup AudioContext on unmount
    useEffect(() => {
        return () => {
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close().catch(() => {
                    // Ignore close errors
                });
            }
        };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        const analyser = analyserRef.current;

        if (!canvas || !analyser) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            if (!isPlaying) {
                // Draw static waveform when not playing
                drawStaticWaveform(ctx, width, height);
                return;
            }

            animationRef.current = requestAnimationFrame(draw);

            analyser.getByteFrequencyData(dataArray);

            ctx.fillStyle = '#f5f5f5';
            ctx.fillRect(0, 0, width, height);

            const barWidth = (width / bufferLength) * 2.5;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArray[i] / 255) * height;

                ctx.fillStyle = barColor;
                ctx.fillRect(x, height - barHeight, barWidth, barHeight);

                x += barWidth + 1;
            }
        };

        if (isPlaying) {
            draw();
        } else {
            drawStaticWaveform(ctx, width, height);
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isPlaying, width, height, barColor]);

    const drawStaticWaveform = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(0, 0, w, h);

        // Draw a static waveform pattern using deterministic values
        ctx.fillStyle = barColor;

        const barCount = 40;
        const barWidth = w / barCount - 2;
        const barSpacing = 2;

        for (let i = 0; i < barCount; i++) {
            const x = i * (barWidth + barSpacing);
            // Use sin/cos for deterministic wave pattern
            const amplitude = Math.sin(i * 0.3) * Math.cos(i * 0.15) + 0.5;
            const barHeight = Math.max(2, amplitude * h * 0.6);
            const y = (h - barHeight) / 2;

            ctx.fillRect(x, y, barWidth, barHeight);
        }
    };

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            style={{
                borderRadius: '4px',
                backgroundColor: '#f5f5f5',
            }}
        />
    );
};

export default WaveformVisualizer;
