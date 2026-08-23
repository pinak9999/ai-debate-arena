// utils/soundEngine.ts

class SoundEngine {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;

  private init() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContext();
    }
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public playBell() {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    const t = this.audioCtx.currentTime;
    
    // Create oscillator for the main body of the bell sound
    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    osc.type = 'sine'; // Sine wave for a smooth, bell-like tone
    osc.frequency.setValueAtTime(440, t); // Starting frequency (A4)
    osc.frequency.exponentialRampToValueAtTime(220, t + 1.5); // Frequency drop for realism

    // Create an oscillator for the metallic 'hit' or 'clang'
    const hitOsc = this.audioCtx.createOscillator();
    const hitGainNode = this.audioCtx.createGain();

    hitOsc.type = 'triangle'; // Triangle wave for a sharper, metallic attack
    hitOsc.frequency.setValueAtTime(880, t); // Higher frequency for the hit
    hitOsc.frequency.exponentialRampToValueAtTime(440, t + 0.5);

    // Envelope for the main bell sound (long decay)
    gainNode.gain.setValueAtTime(0, t);
    gainNode.gain.linearRampToValueAtTime(0.8, t + 0.05); // Quick attack
    gainNode.gain.exponentialRampToValueAtTime(0.01, t + 2.0); // Long, smooth decay

    // Envelope for the metallic hit (short decay)
    hitGainNode.gain.setValueAtTime(0, t);
    hitGainNode.gain.linearRampToValueAtTime(0.5, t + 0.02); // Very quick attack
    hitGainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.3); // Short decay

    // Connect nodes
    osc.connect(gainNode);
    hitOsc.connect(hitGainNode);
    
    gainNode.connect(this.audioCtx.destination);
    hitGainNode.connect(this.audioCtx.destination);

    // Start and stop
    osc.start(t);
    hitOsc.start(t);
    
    osc.stop(t + 2.0);
    hitOsc.stop(t + 0.5);
  }

  public playType() {
     if (this.isMuted) return;
     this.init();
     if (!this.audioCtx) return;

     const t = this.audioCtx.currentTime;
     const osc = this.audioCtx.createOscillator();
     const gainNode = this.audioCtx.createGain();
     const filter = this.audioCtx.createBiquadFilter();

     osc.type = 'square';
     // Randomize pitch slightly for variation
     osc.frequency.setValueAtTime(150 + Math.random() * 50, t);

     // Quick click envelope
     gainNode.gain.setValueAtTime(0, t);
     gainNode.gain.linearRampToValueAtTime(0.15, t + 0.01);
     gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

     // Filter to make it sound less harsh and more mechanical
     filter.type = 'bandpass';
     filter.frequency.setValueAtTime(1000, t);
     filter.Q.setValueAtTime(2, t);

     osc.connect(filter);
     filter.connect(gainNode);
     gainNode.connect(this.audioCtx.destination);

     osc.start(t);
     osc.stop(t + 0.06);
  }

  public playGlitch() {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    const t = this.audioCtx.currentTime;
    const duration = 0.3;
    const bufferSize = this.audioCtx.sampleRate * duration;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    // Create white noise
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noiseSource = this.audioCtx.createBufferSource();
    noiseSource.buffer = buffer;

    const gainNode = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();

    // Glitchy volume envelope
    gainNode.gain.setValueAtTime(0, t);
    gainNode.gain.linearRampToValueAtTime(0.4, t + 0.02);
    gainNode.gain.setValueAtTime(0, t + 0.1);
    gainNode.gain.setValueAtTime(0.5, t + 0.15);
    gainNode.gain.exponentialRampToValueAtTime(0.01, t + duration);

    // Highpass filter for that digital 'zzzt' sound
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(3000, t);
    filter.frequency.linearRampToValueAtTime(500, t + duration);

    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);

    noiseSource.start(t);
  }

  public playJudge() {
     if (this.isMuted) return;
     this.init();
     if (!this.audioCtx) return;

     const t = this.audioCtx.currentTime;
     
     // A major chord for a positive/resolute sound
     const frequencies = [440, 554.37, 659.25]; // A4, C#5, E5
     
     frequencies.forEach((freq, i) => {
         const osc = this.audioCtx!.createOscillator();
         const gainNode = this.audioCtx!.createGain();

         osc.type = 'triangle';
         osc.frequency.setValueAtTime(freq, t);

         // Stagger the attack slightly for an arpeggiated feel
         const delay = i * 0.1;
         
         gainNode.gain.setValueAtTime(0, t + delay);
         gainNode.gain.linearRampToValueAtTime(0.3, t + delay + 0.1);
         gainNode.gain.exponentialRampToValueAtTime(0.01, t + delay + 2.5);

         osc.connect(gainNode);
         gainNode.connect(this.audioCtx!.destination);

         osc.start(t + delay);
         osc.stop(t + delay + 2.6);
     });
  }
}

// Export a singleton instance
export const soundEngine = new SoundEngine();