export function sfxHit(ctx: AudioContext, vol: number = 0.7): void {
  const now = ctx.currentTime;
  
  // White noise -> bandpass
  const noise = ctx.createBufferSource();
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.18, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  noise.buffer = buffer;
  
  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 1200;
  bandpass.Q.value = 8;
  
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(vol, now + 0.01);
  gain.gain.linearRampToValueAtTime(0, now + 0.18);
  
  noise.connect(bandpass);
  bandpass.connect(gain);
  gain.connect(ctx.destination);
  
  noise.start(now);
  noise.stop(now + 0.18);
}

export function sfxKO(ctx: AudioContext): void {
  const now = ctx.currentTime;
  
  // Sine glide
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.exponentialRampToValueAtTime(110, now + 0.25);
  
  const oscGain = ctx.createGain();
  oscGain.gain.setValueAtTime(0.3, now);
  oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
  
  // Noise burst
  const noise = ctx.createBufferSource();
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.25, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.08));
  }
  noise.buffer = buffer;
  
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.4, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
  
  // Compressor
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -24;
  comp.ratio.value = 12;
  
  osc.connect(oscGain);
  noise.connect(noiseGain);
  oscGain.connect(comp);
  noiseGain.connect(comp);
  comp.connect(ctx.destination);
  
  osc.start(now);
  osc.stop(now + 0.25);
  noise.start(now);
  noise.stop(now + 0.25);
}

export function sfxBoost(ctx: AudioContext): void {
  const now = ctx.currentTime;
  
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(440, now);
  osc.frequency.linearRampToValueAtTime(660, now + 0.35);
  
  // Simple chorus effect with detune
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.9;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 8;
  
  lfo.connect(lfoGain);
  lfoGain.connect(osc.detune);
  
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.15, now);
  gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
  gain.gain.linearRampToValueAtTime(0, now + 0.35);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  lfo.start(now);
  osc.start(now);
  osc.stop(now + 0.35);
  lfo.stop(now + 0.35);
}

export function sfxPickup(ctx: AudioContext): void {
  const now = ctx.currentTime;
  
  const freqs = [880, 1320];
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    
    const gain = ctx.createGain();
    const start = now + i * 0.08;
    gain.gain.setValueAtTime(0.2, start);
    gain.gain.exponentialRampToValueAtTime(0.01, start + 0.08);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(start);
    osc.stop(start + 0.08);
  });
}

export function sfxShockwave(ctx: AudioContext): void {
  const now = ctx.currentTime;
  
  const noise = ctx.createBufferSource();
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  
  // Pink noise approximation
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
  noise.buffer = buffer;
  
  const lowshelf = ctx.createBiquadFilter();
  lowshelf.type = 'lowshelf';
  lowshelf.frequency.value = 200;
  lowshelf.gain.value = 6;
  
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.5, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
  
  noise.connect(lowshelf);
  lowshelf.connect(gain);
  gain.connect(ctx.destination);
  
  noise.start(now);
  noise.stop(now + 0.3);
}
