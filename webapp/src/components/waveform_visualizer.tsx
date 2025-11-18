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

    useEffect(() => {
        if (!audioElement) return;

        // Create audio context and analyser
        const initAudioContext = () => {
            if (!audioContextRef.current) {
                const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                audioContextRef.current = new AudioContext();

                const analyser = audioContextRef.current.createAnalyser();
                analyser.fftSize = 256;
                analyserRef.current = analyser;

                const source = audioContextRef.current.createMediaElementSource(audioElement);
                source.connect(analyser);
                analyser.connect(audioContextRef.current.destination);
            }
        };

        // Initialize on first play
        if (isPlaying && !audioContextRef.current) {
            initAudioContext();
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [audioElement, isPlaying]);

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

        // Draw a static waveform pattern
        ctx.strokeStyle = barColor;
        ctx.lineWidth = 2;
        ctx.beginPath();

        const segments = 50;
        const segmentWidth = w / segments;

        for (let i = 0; i < segments; i++) {
            const x = i * segmentWidth;
            const y = h / 2 + Math.sin(i * 0.5) * (h / 4) * Math.random();

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();
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
