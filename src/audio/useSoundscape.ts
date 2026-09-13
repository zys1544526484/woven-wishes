import { useCallback, useEffect, useRef, useState } from "react";

const NOTE_SEQUENCE = [261.63, 293.66, 329.63, 392, 440, 392, 329.63, 293.66] as const;
const MUSIC_LEVEL = 0.62;
const DUCKED_MUSIC_LEVEL = 0.4;

class OfflineSoundscape {
  private context?: AudioContext;
  private master?: GainNode;
  private musicBus?: GainNode;
  private effectsBus?: GainNode;
  private musicTimer?: number;
  private noteIndex = 0;
  private active = false;
  private requested = false;
  private sources = new Set<AudioScheduledSourceNode>();

  private ensureContext(): AudioContext {
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.musicBus = this.context.createGain();
      this.effectsBus = this.context.createGain();
      const compressor = this.context.createDynamicsCompressor();

      this.master.gain.value = 0.0001;
      this.musicBus.gain.value = MUSIC_LEVEL;
      this.effectsBus.gain.value = 0.42;
      compressor.threshold.value = -18;
      compressor.knee.value = 18;
      compressor.ratio.value = 2.5;
      compressor.attack.value = 0.008;
      compressor.release.value = 0.25;

      this.musicBus.connect(compressor);
      this.effectsBus.connect(compressor);
      compressor.connect(this.master).connect(this.context.destination);
    }
    return this.context;
  }

  private trackSource<T extends AudioScheduledSourceNode>(source: T): T {
    this.sources.add(source);
    source.addEventListener("ended", () => this.sources.delete(source), { once: true });
    return source;
  }

  private tonalVoice(
    frequency: number,
    duration: number,
    volume: number,
    destination: GainNode | undefined,
    options: { delay?: number; type?: OscillatorType; detune?: number; cutoff?: number } = {},
  ): void {
    const context = this.context;
    if (!context || !destination || !this.active) return;

    const startAt = context.currentTime + (options.delay ?? 0);
    const oscillator = this.trackSource(context.createOscillator());
    const filter = context.createBiquadFilter();
    const gain = context.createGain();

    oscillator.type = options.type ?? "triangle";
    oscillator.frequency.value = frequency;
    oscillator.detune.value = options.detune ?? 0;
    filter.type = "lowpass";
    filter.frequency.value = options.cutoff ?? 2_200;
    filter.Q.value = 0.55;
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.012);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume * 0.34), startAt + Math.min(0.24, duration * 0.28));
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

    oscillator.connect(filter).connect(gain).connect(destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.04);
  }

  private playAmbientNote = (): void => {
    const frequency = NOTE_SEQUENCE[this.noteIndex % NOTE_SEQUENCE.length];
    this.noteIndex += 1;
    this.tonalVoice(frequency, 1.9, 0.105, this.musicBus, { type: "triangle", cutoff: 1_900 });
    this.tonalVoice(frequency * 2, 1.25, 0.022, this.musicBus, { type: "sine", detune: 2, cutoff: 2_800 });
  };

  async start(): Promise<void> {
    this.requested = true;
    if (this.active) return;
    const context = this.ensureContext();
    try {
      await context.resume();
    } catch {
      return;
    }

    // A blocked autoplay attempt can resolve after the visitor has muted.
    if (!this.requested || this.active) return;
    this.active = true;
    this.master?.gain.cancelScheduledValues(context.currentTime);
    this.master?.gain.setTargetAtTime(0.78, context.currentTime, 0.18);
    this.musicBus?.gain.cancelScheduledValues(context.currentTime);
    this.musicBus?.gain.setTargetAtTime(MUSIC_LEVEL, context.currentTime, 0.12);
    this.playAmbientNote();
    this.musicTimer = window.setInterval(this.playAmbientNote, 4_200);
  }

  stop(): void {
    this.requested = false;
    this.active = false;
    if (this.musicTimer !== undefined) window.clearInterval(this.musicTimer);
    this.musicTimer = undefined;

    const context = this.context;
    if (context && this.master) {
      this.master.gain.cancelScheduledValues(context.currentTime);
      this.master.gain.setTargetAtTime(0.0001, context.currentTime, 0.035);
      this.sources.forEach((source) => {
        try {
          source.stop(context.currentTime + 0.14);
        } catch {
          // The source may already have ended.
        }
      });
    }
    this.sources.clear();
  }

  playWeft(row: number): void {
    const context = this.context;
    const effectsBus = this.effectsBus;
    if (!context || !effectsBus || !this.active) return;

    const duration = 0.08;
    const frameCount = Math.max(1, Math.floor(context.sampleRate * duration));
    const buffer = context.createBuffer(1, frameCount, context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let index = 0; index < samples.length; index += 1) {
      const progress = index / Math.max(1, samples.length - 1);
      const envelope = Math.sin(Math.PI * progress) * (1 - progress);
      samples[index] = (Math.random() * 2 - 1) * envelope;
    }

    const stage = Math.min(3, Math.floor(row / 6));
    const source = this.trackSource(context.createBufferSource());
    const highpass = context.createBiquadFilter();
    const bandpass = context.createBiquadFilter();
    const gain = context.createGain();
    const peak = 0.034 + stage * 0.002;

    source.buffer = buffer;
    highpass.type = "highpass";
    highpass.frequency.value = 900;
    highpass.Q.value = 0.7;
    bandpass.type = "bandpass";
    bandpass.frequency.value = 2_200 + stage * 300;
    bandpass.Q.value = 1.9 + stage * 0.1;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(peak, context.currentTime + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    source.connect(highpass).connect(bandpass).connect(gain).connect(effectsBus);
    source.start();

    this.tonalVoice(620 + stage * 72 + (row % 3) * 18, 0.14, 0.052, effectsBus, { type: "triangle", cutoff: 2_600 });

    if ((row + 1) % 6 === 0) {
      const stageCue = [329.63, 392, 440, 523.25] as const;
      this.tonalVoice(stageCue[stage], 0.82, 0.085, effectsBus, { type: "triangle", cutoff: 2_300 });
    }
  }

  playComplete(): void {
    const context = this.context;
    const effectsBus = this.effectsBus;
    const musicBus = this.musicBus;
    if (!context || !effectsBus || !musicBus || !this.active) return;

    musicBus.gain.cancelScheduledValues(context.currentTime);
    musicBus.gain.setTargetAtTime(DUCKED_MUSIC_LEVEL, context.currentTime, 0.08);
    musicBus.gain.setTargetAtTime(MUSIC_LEVEL, context.currentTime + 1.8, 0.28);

    [329.63, 392, 523.25].forEach((frequency, index) => {
      this.tonalVoice(frequency, 0.96, 0.095, effectsBus, {
        delay: index * 0.14,
        type: "triangle",
        cutoff: 2_600,
      });
    });
  }
}

const soundscape = new OfflineSoundscape();

export interface SoundscapeControls {
  enabled: boolean;
  start: () => void;
  toggle: () => void;
  stop: () => void;
  playWeft: (row: number) => void;
  playComplete: () => void;
}

export function useSoundscape(): SoundscapeControls {
  const [enabled, setEnabled] = useState(true);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const start = useCallback(() => {
    if (enabledRef.current) void soundscape.start();
  }, []);
  const toggle = useCallback(() => {
    const next = !enabledRef.current;
    enabledRef.current = next;
    setEnabled(next);
    if (next) void soundscape.start();
    else soundscape.stop();
  }, []);
  const playWeft = useCallback((row: number) => soundscape.playWeft(row), []);
  const playComplete = useCallback(() => soundscape.playComplete(), []);
  const stop = useCallback(() => soundscape.stop(), []);

  useEffect(() => {
    start();
    window.addEventListener("pointerdown", start);
    window.addEventListener("keydown", start);
    return () => {
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
      soundscape.stop();
    };
  }, [start]);

  return { enabled, start, toggle, stop, playWeft, playComplete };
}
