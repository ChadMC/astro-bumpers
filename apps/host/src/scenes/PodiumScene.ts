import Phaser from 'phaser';
import { network } from '../network.js';

export class PodiumScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PodiumScene' });
  }
  
  create() {
    // Background
    this.add.rectangle(960, 540, 1920, 1080, 0x0a0f1e);
    
    // Title
    this.add.text(960, 200, 'Round Complete!', {
      fontSize: '96px',
      fontFamily: 'system-ui, sans-serif',
      color: '#58d7ff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    
    // Rematch button
    const button = this.add.rectangle(960, 700, 400, 100, 0x58d7ff)
      .setInteractive()
      .on('pointerdown', () => {
        network.sendHostCommand('rematch');
        this.scene.start('LobbyScene');
      })
      .on('pointerover', () => button.setFillStyle(0x70e9ff))
      .on('pointerout', () => button.setFillStyle(0x58d7ff));
    
    this.add.text(960, 700, 'REMATCH', {
      fontSize: '48px',
      fontFamily: 'system-ui, sans-serif',
      color: '#0a0f1e',
      fontStyle: 'bold',
    }).setOrigin(0.5);
  }
}
