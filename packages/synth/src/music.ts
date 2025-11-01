const TEMPO = 112; // BPM
const BEAT_DURATION = 60 / TEMPO;

interface MusicContext {
  ctx: AudioContext;
  nodes: (OscillatorNode | AudioBufferSourceNode)[];
  gains: GainNode[];
  stopRequested: boolean;
}

export function startMusic(ctx: AudioContext): { stop: () => void } {
  const musicCtx: MusicContext = {
    ctx,
    nodes: [],
    gains: [],
    stopRequested: false,
  };
  
  // Minor pentatonic scale (C minor pentatonic)
  const rootNote = 130.81; // C3
  const scale = [0, 3, 5, 7, 10]; // Minor pentatonic intervals
  
  const playDrums = (startTime: number) => {
    // Kick drum (sine pitch envelope)
    const kick = ctx.createOscillator();
    kick.type = 'sine';
    kick.frequency.setValueAtTime(150, startTime);
    kick.frequency.exponentialRampToValueAtTime(40, startTime + 0.1);
    
    const kickGain = ctx.createGain();
    kickGain.gain.setValueAtTime(0.8, startTime);
    kickGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
    
    kick.connect(kickGain);
    kickGain.connect(ctx.destination);
    
    kick.start(startTime);
    kick.stop(startTime + 0.15);
    
    // Snare (noise with transient)
    const snare = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.05));
    }
    snare.buffer = buffer;
    
    const snareGain = ctx.createGain();
    snareGain.gain.setValueAtTime(0.4, startTime + BEAT_DURATION);
    snareGain.gain.exponentialRampToValueAtTime(0.01, startTime + BEAT_DURATION + 0.15);
    
    snare.connect(snareGain);
    snareGain.connect(ctx.destination);
    
    snare.start(startTime + BEAT_DURATION);
    
    musicCtx.nodes.push(kick, snare);
    musicCtx.gains.push(kickGain, snareGain);
  };
  
  const playBass = (startTime: number, pattern: number[]) => {
    pattern.forEach((note, i) => {
      const freq = rootNote * Math.pow(2, scale[note % scale.length] / 12);
      const time = startTime + i * BEAT_DURATION / 2;
      
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.15, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, time + BEAT_DURATION / 2);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(time);
      osc.stop(time + BEAT_DURATION / 2);
      
      musicCtx.nodes.push(osc);
      musicCtx.gains.push(gain);
    });
  };
  
  const playLead = (startTime: number, melody: number[]) => {
    melody.forEach((note, i) => {
      if (note < 0) return; // rest
      
      const freq = rootNote * 2 * Math.pow(2, scale[note % scale.length] / 12);
      const time = startTime + i * BEAT_DURATION / 2;
      
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = freq;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1200;
      filter.Q.value = 1;
      
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.08, time + 0.01);
      gain.gain.setValueAtTime(0.08, time + BEAT_DURATION / 4);
      gain.gain.exponentialRampToValueAtTime(0.01, time + BEAT_DURATION / 2);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(time);
      osc.stop(time + BEAT_DURATION / 2);
      
      musicCtx.nodes.push(osc);
      musicCtx.gains.push(gain);
    });
  };
  
  const loop = () => {
    if (musicCtx.stopRequested) return;
    
    const now = ctx.currentTime;
    const barDuration = BEAT_DURATION * 4;
    
    // Schedule next bar
    playDrums(now);
    playBass(now, [0, 0, 2, 2, 3, 3, 2, 0]); // 8th notes
    playLead(now, [0, 2, 3, 4, 3, 2, 0, -1]); // melody with rest
    
    // Clean up old nodes
    setTimeout(() => {
      musicCtx.nodes.forEach(node => {
        try {
          if ('stop' in node) node.stop();
        } catch (e) {
          // Already stopped
        }
      });
      musicCtx.gains.forEach(gain => gain.disconnect());
      musicCtx.nodes = [];
      musicCtx.gains = [];
    }, barDuration * 1000 + 100);
    
    setTimeout(loop, barDuration * 1000);
  };
  
  // Start the loop
  loop();
  
  return {
    stop: () => {
      musicCtx.stopRequested = true;
      musicCtx.nodes.forEach(node => {
        try {
          if ('stop' in node) node.stop();
        } catch (e) {
          // Already stopped
        }
      });
      musicCtx.gains.forEach(gain => gain.disconnect());
    },
  };
}
