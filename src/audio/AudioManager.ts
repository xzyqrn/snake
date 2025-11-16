export class AudioManager {
  private audioContext: AudioContext | null = null;
  private sounds: { [key: string]: AudioBuffer } = {};
  private enabled: boolean = true;
  private volume: number = 0.3;

  constructor() {
    this.initializeAudio();
  }

  private async initializeAudio(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Generate sound effects procedurally
      this.generateSounds();
      
      // Enable audio on first user interaction
      document.addEventListener('click', () => {
        if (this.audioContext && this.audioContext.state === 'suspended') {
          this.audioContext.resume();
        }
      }, { once: true });
      
    } catch (error) {
      console.warn('Audio not supported:', error);
      this.enabled = false;
    }
  }

  private generateSounds(): void {
    // Generate eat sound (pleasant chime)
    this.sounds.eat = this.createTone(800, 0.1, 'sine', 0.2);
    
    // Generate game over sound (descending tone)
    this.sounds.gameOver = this.createDescendingTone(400, 200, 0.5, 'sawtooth');
    
    // Generate start sound (ascending tone)
    this.sounds.start = this.createAscendingTone(300, 600, 0.2, 'sine');
    
    // Generate pause sound (short beep)
    this.sounds.pause = this.createTone(500, 0.05, 'square', 0.1);
    
    // Generate resume sound (slightly higher beep)
    this.sounds.resume = this.createTone(600, 0.05, 'square', 0.1);
  }

  private createTone(frequency: number, duration: number, type: OscillatorType, volume: number): AudioBuffer {
    if (!this.audioContext) return new AudioBuffer({ length: 1, sampleRate: 44100 });
    
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 10); // Exponential decay
      
      let sample = 0;
      switch (type) {
        case 'sine':
          sample = Math.sin(2 * Math.PI * frequency * t);
          break;
        case 'square':
          sample = Math.sign(Math.sin(2 * Math.PI * frequency * t));
          break;
        case 'sawtooth':
          sample = 2 * (t * frequency - Math.floor(t * frequency + 0.5));
          break;
        case 'triangle':
          sample = 2 * Math.abs(2 * (t * frequency - Math.floor(t * frequency + 0.5))) - 1;
          break;
      }
      
      data[i] = sample * envelope * volume;
    }
    
    return buffer;
  }

  private createAscendingTone(startFreq: number, endFreq: number, duration: number, type: OscillatorType): AudioBuffer {
    if (!this.audioContext) return new AudioBuffer({ length: 1, sampleRate: 44100 });
    
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const frequency = startFreq + (endFreq - startFreq) * (t / duration);
      const envelope = Math.exp(-t * 5);
      
      let sample = 0;
      switch (type) {
        case 'sine':
          sample = Math.sin(2 * Math.PI * frequency * t);
          break;
        case 'square':
          sample = Math.sign(Math.sin(2 * Math.PI * frequency * t));
          break;
      }
      
      data[i] = sample * envelope * 0.2;
    }
    
    return buffer;
  }

  private createDescendingTone(startFreq: number, endFreq: number, duration: number, type: OscillatorType): AudioBuffer {
    if (!this.audioContext) return new AudioBuffer({ length: 1, sampleRate: 44100 });
    
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const frequency = startFreq - (startFreq - endFreq) * (t / duration);
      const envelope = Math.exp(-t * 3);
      
      let sample = 0;
      switch (type) {
        case 'sawtooth':
          sample = 2 * (t * frequency - Math.floor(t * frequency + 0.5));
          break;
        case 'sine':
          sample = Math.sin(2 * Math.PI * frequency * t);
          break;
      }
      
      data[i] = sample * envelope * 0.15;
    }
    
    return buffer;
  }

  public async playSound(soundName: string): Promise<void> {
    if (!this.enabled || !this.audioContext || !this.sounds[soundName]) return;
    
    try {
      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = this.sounds[soundName];
      gainNode.gain.value = this.volume;
      
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      source.start(0);
      
      // Clean up after sound finishes
      source.onended = () => {
        source.disconnect();
        gainNode.disconnect();
      };
      
    } catch (error) {
      console.warn('Error playing sound:', error);
    }
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  public toggleEnabled(): void {
    this.enabled = !this.enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  // Create a simple beep sound for UI feedback
  public playBeep(frequency: number = 440, duration: number = 0.1): void {
    if (!this.enabled || !this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }
}