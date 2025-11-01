// Physics constants (in pixels)
export const PHYSICS = {
  // Player ship
  SHIP_RADIUS: 34,
  SHIP_MASS: 12,
  SHIP_RESTITUTION: 0.6,
  SHIP_FRICTION_AIR: 0.02,
  BASE_THRUST: 0.0012,
  STEERING_TORQUE: 0.0018,
  BOOST_IMPULSE: 1800,
  BOOST_DURATION: 350, // ms
  BOOST_COOLDOWN: 2000, // ms

  // KO
  KO_DISTANCE_THRESHOLD: 40,
  KO_IMPULSE_THRESHOLD: 2800,
  KO_SOFT_BOUND_TIME: 800, // ms

  // World
  WORLD_WIDTH: 1920,
  WORLD_HEIGHT: 1080,
  
  // Timing
  TICK_RATE: 30, // Hz
  FIXED_DT: 1000 / 30, // ms
} as const;

// Power-up configurations
export const POWERUP_CONFIG = {
  nitro: {
    duration: 2000,
    speedBoost: 0.6,
    thrustBoost: 0.25,
    trailMultiplier: 1.5,
  },
  shock: {
    duration: 6000,
    impulseRadius: 150,
    impulse: 2200,
  },
  heavy: {
    duration: 7000,
    massMult: 1.7,
    restitutionDelta: -0.2,
    knockbackReduction: 0.25,
  },
  glue: {
    duration: 7000,
    frictionMult: 1.8,
    frictionAirReduction: 0.3,
  },
  ghost: {
    duration: 1500,
  },
  tractor: {
    duration: 2000,
    range: 300,
    force: 600,
  },
} as const;

// Design tokens
export const COLORS = {
  bg0: '#0a0f1e',
  line: '#1b2550',
  players: ['#ff5a8a', '#58d7ff', '#ffd262', '#8ef07a', '#c090ff', '#ff8c4b'],
  hazard: '#ff3b3b',
  pickup: '#66ffcc',
  star: '#ffe066',
  laser: '#ff4d6d',
} as const;

// Emoji options for players
export const PLAYER_EMOJIS = ['🚀', '⭐', '🔥', '⚡', '💫', '🌟', '✨', '💥', '🎯', '🎪', '🎨', '🎭'];

// Audio config
export const AUDIO = {
  MUSIC_TEMPO: 112, // BPM
  MUSIC_TIME_SIG: [4, 4],
} as const;

// Network config
export const NETWORK = {
  SNAPSHOT_HZ_MIN: 10,
  SNAPSHOT_HZ_MAX: 20,
  INPUT_RATE_MIN: 12, // Hz
  INPUT_RATE_MAX: 20, // Hz
  RECONNECT_TIMEOUT: 30000, // ms
} as const;

// Game config
export const GAME = {
  MIN_PLAYERS: 1,
  MAX_PLAYERS: 12,
  DEFAULT_ROUNDS: 3,
  ROUND_DURATION: 90000, // ms
  COUNTDOWN_DURATION: 3000, // ms
  PICKUP_RESPAWN_MIN: 3000, // ms
  PICKUP_RESPAWN_MAX: 6000, // ms
  MAX_PICKUPS: 3,
} as const;
