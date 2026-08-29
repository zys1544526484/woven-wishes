import { useCallback, useEffect, useRef, useState } from "react";

const NOTE_SEQUENCE = [261.63, 293.66, 329.63, 392, 440, 392, 329.63, 293.66] as const;

class OfflineSoundscape {
  private context?: AudioContext;
  private master?: GainNode;
  private musicTimer?: number;
  private noteIndex = 0;
  private active = false;

  private ensureContext(): AudioContext {
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = 0;
      this.master.connect(this.context.destination);
    }
    return this.context;
  }

  private tone(frequency: number, duration: number, volume: number, detune = 0): void {
    const context = this.context;
    const master = this.master;
    if (!context || !master || !this.active) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    oscillator.detune.value = detune;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(volume, context.currentTime + 0.16);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    oscillator.connect(gain).connect(master);
    oscillator.start();
    oscillator.stop(context.currentTime + duration + 0.05);
  }

  private playAmbientNote = (): void => {
    const frequency = NOTE_SEQUENCE[this.noteIndex % NOTE_SEQUENCE.length];
    this.noteIndex += 1;
    this.tone(frequency, 3.25, 0.06, -2);
    this.tone(frequency * 2, 2.35, 0.016, 3);
  };

  async start(): Promise<void> {
    if (this.active) return;
    const context = this.ensureContext();
    this.active = true;
    await context.resume();
    this.master?.gain.cancelScheduledValues(context.currentTime);
    this.master?.gain.setTargetAtTime(0.42, context.currentTime, 0.32);
    this.playAmbientNote();
    this.musicTimer = window.setInterval(this.playAmbientNote, 2600);
  }

  stop(): void {
    if (!this.active) return;
    this.active = false;
    if (this.musicTimer !== undefined) window.clearInterval(this.musicTimer);
    this.musicTimer = undefined;
    const context = this.context;
    if (context && this.master) this.master.gain.setTargetAtTime(0.0001, context.currentTime, 0.08);
  }

  playWeft(row: number): void {
    const context = this.context;
    const master = this.master;
    if (!context || !master || !this.active) return;
    const frameCount = Math.max(1, Math.floor(context.sampleRate * 0.18));
    const buffer = context.createBuffer(1, frameCount, context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let index = 0; index < samples.length; index += 1) {
      const envelope = 1 - index / samples.length;
      samples[index] = (Math.random() * 2 - 1) * envelope;
    }
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    filter.type = "bandpass";
    const stage = Math.min(3, Math.floor(row / 6));
    const stageFrequencies = [720, 1040, 1360, 1640] as const;
    const stageVolumes = [0.024, 0.029, 0.034, 0.039] as const;
    filter.frequency.value = stageFrequencies[stage];
    filter.Q.value = 0.72 + stage * 0.11;
    gain.gain.value = stageVolumes[stage];
    source.buffer = buffer;
    source.connect(filter).connect(gain).connect(master);
    source.start();
    if (stage >= 1) this.tone(294 + stage * 49 + (row % 3) * 14, 0.5, 0.012 + stage * 0.003);
    if (stage >= 2) this.tone(588 + (row % 4) * 18, 0.38, 0.008 + stage * 0.002, 3);
    if ((row + 1) % 6 === 0) {
      this.tone(392 + stage * 55, 0.95, 0.042);
      if (stage === 3) this.tone(587, 1.2, 0.025, 4);
    }
  }

  playComplete(): void {
    [329.63, 392, 523.25].forEach((frequency, index) => {
      window.setTimeout(() => this.tone(frequency, 2.4, 0.058), index * 120);
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
    setEnabled((current) => {
      const next = !current;
      if (next) void soundscape.start();
      else soundscape.stop();
      return next;
    });
  }, []);
  const playWeft = useCallback((row: number) => soundscape.playWeft(row), []);
  const playComplete = useCallback(() => soundscape.playComplete(), []);
  const stop = useCallback(() => soundscape.stop(), []);

  useEffect(() => () => soundscape.stop(), []);

  return { enabled, start, toggle, stop, playWeft, playComplete };
}
