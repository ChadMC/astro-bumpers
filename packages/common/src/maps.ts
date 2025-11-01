import type { MapData, MapId } from './types.js';

export const MAPS: Record<MapId, MapData> = {
  launchpad: {
    id: 'launchpad',
    bounds: { type: 'circle', r: 520, cx: 0, cy: 0 },
    spawnPoints: [
      [-320, -120],
      [320, -120],
      [-320, 120],
      [320, 120],
      [0, -240],
      [0, 240],
      [-240, 0],
      [240, 0],
    ],
    hazards: [],
    pickupNodes: [
      [-200, 0],
      [0, 0],
      [200, 0],
    ],
  },
  beltway: {
    id: 'beltway',
    bounds: { type: 'circle', r: 540, cx: 0, cy: 0 },
    spawnPoints: [
      [-280, -140],
      [280, -140],
      [-280, 140],
      [280, 140],
      [0, -260],
      [0, 260],
    ],
    hazards: [
      { type: 'conveyor', x: 0, y: -420, params: { width: 800, height: 80, angle: 0, speed: 280 } },
      { type: 'conveyor', x: 420, y: 0, params: { width: 80, height: 800, angle: Math.PI / 2, speed: 280 } },
      { type: 'conveyor', x: 0, y: 420, params: { width: 800, height: 80, angle: Math.PI, speed: 280 } },
      { type: 'conveyor', x: -420, y: 0, params: { width: 80, height: 800, angle: -Math.PI / 2, speed: 280 } },
    ],
    pickupNodes: [
      [-150, 0],
      [150, 0],
      [0, -150],
      [0, 150],
    ],
  },
  pinball: {
    id: 'pinball',
    bounds: { type: 'circle', r: 560, cx: 0, cy: 0 },
    spawnPoints: [
      [-300, -150],
      [300, -150],
      [-300, 150],
      [300, 150],
      [0, -280],
      [0, 280],
    ],
    hazards: [
      { type: 'bumper', x: -200, y: -100, params: { radius: 60 } },
      { type: 'bumper', x: 200, y: -100, params: { radius: 60 } },
      { type: 'bumper', x: -200, y: 100, params: { radius: 60 } },
      { type: 'bumper', x: 200, y: 100, params: { radius: 60 } },
      { type: 'bumper', x: 0, y: 0, params: { radius: 80 } },
    ],
    pickupNodes: [
      [-250, 0],
      [250, 0],
      [0, -200],
      [0, 200],
    ],
  },
  spokes: {
    id: 'spokes',
    bounds: { type: 'circle', r: 540, cx: 0, cy: 0 },
    spawnPoints: [
      [-320, -120],
      [320, -120],
      [-320, 120],
      [320, 120],
      [0, -300],
      [0, 300],
      [-300, 0],
      [300, 0],
    ],
    hazards: [
      { type: 'mace', x: -280, y: -140, params: { length: 100, speed: 1.0 } },
      { type: 'mace', x: 280, y: -140, params: { length: 100, speed: -1.0 } },
      { type: 'mace', x: -280, y: 140, params: { length: 100, speed: -1.0 } },
      { type: 'mace', x: 280, y: 140, params: { length: 100, speed: 1.0 } },
    ],
    pickupNodes: [
      [-180, 0],
      [180, 0],
      [0, -180],
      [0, 180],
    ],
  },
};
