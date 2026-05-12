export class AudioManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.value = 0.3;
        
        this.musicPlaying = false;
        this.tempo = 120;
        this.nextNoteTime = 0;
        this.current16thNote = 0;
        this.combo = 0;
    }

    setCombo(combo) {
        this.combo = combo;
    }

    startMusic() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        if (this.musicPlaying) return;
        this.musicPlaying = true;
        this.nextNoteTime = this.ctx.currentTime + 0.1;
        this.scheduler();
    }

    stopMusic() {
        this.musicPlaying = false;
    }

    scheduler() {
        if (!this.musicPlaying) return;
        
        while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
            this.scheduleNote(this.current16thNote, this.nextNoteTime);
            this.nextNote();
        }
        
        setTimeout(() => this.scheduler(), 25);
    }

    nextNote() {
        const secondsPerBeat = 60.0 / this.tempo;
        this.nextNoteTime += 0.25 * secondsPerBeat;
        this.current16thNote++;
        if (this.current16thNote === 16) {
            this.current16thNote = 0;
        }
    }

    scheduleNote(beatNumber, time) {
        // Kick Drum (Always on)
        if (beatNumber % 4 === 0) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.frequency.setValueAtTime(150, time);
            osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
            gain.gain.setValueAtTime(0.8, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
            
            osc.start(time);
            osc.stop(time + 0.5);
        }

        // Bassline (When combo > 2)
        if (this.combo > 2 && beatNumber % 2 === 0) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            const freqs = [55, 55, 65, 55];
            osc.frequency.setValueAtTime(freqs[Math.floor(beatNumber/4)], time);
            gain.gain.setValueAtTime(0.3, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
            
            osc.start(time);
            osc.stop(time + 0.2);
        }

        // Arp (When combo > 5)
        if (this.combo > 5) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1000 + (this.combo * 100), time);
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);
            
            const arpFreqs = [220, 261.63, 329.63, 392.00]; // Am pentatonic
            osc.frequency.setValueAtTime(arpFreqs[beatNumber % 4], time);
            gain.gain.setValueAtTime(0.1, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
            
            osc.start(time);
            osc.stop(time + 0.1);
        }
    }

    playLaser() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playExplosion() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const noise = this.ctx.createBufferSource();
        const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.5, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < buffer.length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        noise.buffer = buffer;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.4);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start();
    }

    playClick() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }
}
