export type ID = string; // uuid v4
export type UnixMs = number;

export type ModeId = 'lastAlive' | 'stock' | 'king' | 'coin';
export type MapId = 'launchpad' | 'beltway' | 'pinball' | 'spokes';
export type PowerUpId = 'nitro' | 'shock' | 'heavy' | 'glue' | 'ghost' | 'tractor';
export type DeviceType = 'host' | 'controller';
export type PlayerState = 'alive' | 'ko' | 'respawn' | 'dead';

export interface JoinReq {
  roomCode: string;
  nickname: string;
  device: DeviceType;
}

export interface Welcome {
  playerId: ID;
  roomState: RoomSummary;
  jwt: string;
}

export interface RoomSummary {
  roomCode: string;
  hostId: ID | null;
  players: PlayerSummary[];
  map: MapId;
  mode: ModeId;
  state: 'lobby' | 'countdown' | 'playing' | 'podium';
  countdown?: number;
}

export interface PlayerSummary {
  id: ID;
  nickname: string;
  color: string;
  emoji: string;
  device: DeviceType;
  connected: boolean;
  isBot: boolean;
}

export interface InputIntent {
  seq: number;
  steer: number; // -1..1
  boost: 0 | 1;
  ts: UnixMs;
}

export interface Snapshot {
  tick: number;
  t: UnixMs;
  players: PlayerSnapshot[];
  pickups: PickupSnapshot[];
  hazards: HazardSnapshot[];
  events?: GameEvent[];
}

export interface PlayerSnapshot {
  id: ID;
  x: number;
  y: number;
  a: number; // angle in radians
  vx: number;
  vy: number;
  state: PlayerState;
  lives: number;
  pwr?: PowerUpId;
  pwrTtl?: number;
  stars?: number;
}

export interface PickupSnapshot {
  id: ID;
  x: number;
  y: number;
  type: PowerUpId;
}

export interface HazardSnapshot {
  id: ID;
  type: 'mace' | 'laser' | 'blackhole' | 'conveyor' | 'bumper';
  x: number;
  y: number;
  angle?: number;
  state?: 'off' | 'telegraph' | 'on';
  radius?: number;
}

export type GameEvent =
  | { type: 'KO'; by: ID | null; victim: ID; impulse: number; t: UnixMs }
  | { type: 'PWR'; player: ID; pwr: PowerUpId; ttl: number }
  | { type: 'SCORE'; table: Array<{ id: ID; kos: number; stars: number; lives: number }> }
  | { type: 'ROUND_START'; round: number; mode: ModeId; map: MapId }
  | { type: 'ROUND_END'; round: number; winner: ID | null };

export interface HostCommand {
  type: 'start' | 'rematch' | 'switchMap' | 'switchMode';
  data?: {
    map?: MapId;
    mode?: ModeId;
  };
}

export interface MapData {
  id: MapId;
  bounds: CircleBounds | RectBounds;
  spawnPoints: [number, number][];
  hazards: HazardDef[];
  pickupNodes: [number, number][];
}

export interface CircleBounds {
  type: 'circle';
  r: number;
  cx: number;
  cy: number;
}

export interface RectBounds {
  type: 'rect';
  width: number;
  height: number;
  cx: number;
  cy: number;
}

export interface HazardDef {
  type: 'mace' | 'laser' | 'blackhole' | 'conveyor' | 'bumper';
  x: number;
  y: number;
  params?: Record<string, unknown>;
}
