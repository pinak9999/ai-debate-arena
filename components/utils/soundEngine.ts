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
    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();
    const hitOsc = this.audioCtx.createOscillator();
    const hitGainNode = this.audioCtx.createGain();

    osc.type = 'sine'; 
    osc.frequency.setValueAtTime(440, t); 
    osc.frequency.exponentialRampToValueAtTime(220, t + 1.5); 
    hitOsc.type = 'triangle'; 
    hitOsc.frequency.setValueAtTime(880, t); 
    hitOsc.frequency.exponentialRampToValueAtTime(440, t + 0.5);

    gainNode.gain.setValueAtTime(0, t);
    gainNode.gain.linearRampToValueAtTime(0.8, t + 0.05); 
    gainNode.gain.exponentialRampToValueAtTime(0.01, t + 2.0); 
    hitGainNode.gain.setValueAtTime(0, t);
    hitGainNode.gain.linearRampToValueAtTime(0.5, t + 0.02); 
    hitGainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.3); 

    osc.connect(gainNode);
    hitOsc.connect(hitGainNode);
    gainNode.connect(this.audioCtx.destination);
    hitGainNode.connect(this.audioCtx.destination);
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
     osc.frequency.setValueAtTime(150 + Math.random() * 50, t);
     gainNode.gain.setValueAtTime(0, t);
     gainNode.gain.linearRampToValueAtTime(0.15, t + 0.01);
     gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

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
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noiseSource = this.audioCtx.createBufferSource();
    noiseSource.buffer = buffer;
    const gainNode = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();

    gainNode.gain.setValueAtTime(0, t);
    gainNode.gain.linearRampToValueAtTime(0.4, t + 0.02);
    gainNode.gain.setValueAtTime(0, t + 0.1);
    gainNode.gain.setValueAtTime(0.5, t + 0.15);
    gainNode.gain.exponentialRampToValueAtTime(0.01, t + duration);

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
     const frequencies = [440, 554.37, 659.25]; 
     frequencies.forEach((freq, i) => {
         const osc = this.audioCtx!.createOscillator();
         const gainNode = this.audioCtx!.createGain();
         osc.type = 'triangle';
         osc.frequency.setValueAtTime(freq, t);
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

  // 🔥 NEW: APPLAUSE (तालियों की आवाज़)
  public playApplause() {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;
    const t = this.audioCtx.currentTime;
    const duration = 2.5;
    const bufferSize = this.audioCtx.sampleRate * duration;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Creating "Crowd" noise
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const noiseSource = this.audioCtx.createBufferSource();
    noiseSource.buffer = buffer;
    
    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, t);
    filter.Q.setValueAtTime(0.5, t);

    const gainNode = this.audioCtx.createGain();
    gainNode.gain.setValueAtTime(0, t);
    gainNode.gain.linearRampToValueAtTime(0.6, t + 0.3); // Crowd swelling up
    gainNode.gain.exponentialRampToValueAtTime(0.01, t + duration);

    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);
    noiseSource.start(t);
  }

  // 🔥 NEW: BOOING (हूटिंग / डिमोशन साउंड)
  public playBoo() {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;
    const t = this.audioCtx.currentTime;
    
    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();
    
    osc.type = 'sawtooth';
    // Downward pitch bend for "Boo / Disappointment"
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 1.5);
    
    gainNode.gain.setValueAtTime(0, t);
    gainNode.gain.linearRampToValueAtTime(0.4, t + 0.2);
    gainNode.gain.exponentialRampToValueAtTime(0.01, t + 1.5);
    
    osc.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);
    
    osc.start(t);
    osc.stop(t + 1.5);
  }
}

export const soundEngine = new SoundEngine();