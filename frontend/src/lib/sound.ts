interface SoundSpec {
  freq: number;
  decay: number;
  spread: number;
  wave: OscillatorType;
  errorFreq: number;
}

const SPECS: Record<string, SoundSpec> = {
  comedic: { freq: 620, decay: 0.05, spread: 0.22, wave: "triangle", errorFreq: 180 },
  horror: { freq: 150, decay: 0.13, spread: 0.1, wave: "sine", errorFreq: 72 },
  romantic: { freq: 780, decay: 0.09, spread: 0.14, wave: "sine", errorFreq: 300 },
  poetic: { freq: 440, decay: 0.12, spread: 0.3, wave: "sine", errorFreq: 210 },
  technical: { freq: 880, decay: 0.03, spread: 0.04, wave: "square", errorFreq: 120 },
};

const FALLBACK = SPECS.comedic;

class SoundEngine {
  private context: AudioContext | null = null;
  private spec: SoundSpec = FALLBACK;

  enabled = false;
  volume = 0.35;

  unlock(): void {
    if (this.context) {
      void this.context.resume();
      return;
    }
    try {
      this.context = new AudioContext();
    } catch {
      this.context = null;
    }
  }

  setGenre(genre: string): void {
    this.spec = SPECS[genre] ?? FALLBACK;
  }

  key(): void {
    this.blip(this.spec.freq, this.spec.decay, this.spec.wave);
  }

  error(): void {
    this.blip(this.spec.errorFreq, this.spec.decay * 1.8, "sawtooth", 0.6);
  }

  private blip(
    frequency: number,
    decay: number,
    wave: OscillatorType,
    gainScale = 1,
  ): void {
    if (!this.enabled || !this.context || this.volume <= 0) return;

    const ctx = this.context;
    const now = ctx.currentTime;
    const detune = 1 + (Math.random() - 0.5) * this.spec.spread;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = wave;
    osc.frequency.value = frequency * detune;

    gain.gain.setValueAtTime(this.volume * 0.28 * gainScale, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + decay);
  }
}

export const sound = new SoundEngine();
