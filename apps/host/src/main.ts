import Phaser from 'phaser';
import { LobbyScene } from './scenes/LobbyScene.js';
import { GameScene } from './scenes/GameScene.js';
import { PodiumScene } from './scenes/PodiumScene.js';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1920,
  height: 1080,
  backgroundColor: '#0a0f1e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [LobbyScene, GameScene, PodiumScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
};

new Phaser.Game(config);
