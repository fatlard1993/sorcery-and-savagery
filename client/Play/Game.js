import { styled } from '@vanilla-bean/components';
import Phaser from 'phaser';
import gameContext from '../shared/gameContext.js';
import GameScene from './GameScene.js';

export default class Game extends (styled.Component`
	flex: 1;
	width: 100%;
	overflow: hidden;

	& canvas {
		display: block !important;
		width: 100% !important;
		height: 100% !important;
	}
`) {
	build() {
		// Create Phaser game instance after elem is in DOM
		gameContext.game = new Phaser.Game({
			type: Phaser.WEBGL,
			parent: this.elem,
			width: window.innerWidth,
			height: window.innerHeight - 60,
			scene: GameScene,
			backgroundColor: '#1a1a1a',
			physics: {
				default: 'arcade',
				arcade: {
					debug: false,
				},
			},
		});

		// Handle window resize
		window.addEventListener('resize', this.handleResize);
	}

	handleResize = () => {
		if (gameContext.game) {
			gameContext.game.scale.resize(window.innerWidth, window.innerHeight - 60);
		}
	};

	destroy() {
		window.removeEventListener('resize', this.handleResize);
		if (gameContext.game) {
			gameContext.game.destroy(true);
			gameContext.game = null;
		}
		super.destroy();
	}
}
