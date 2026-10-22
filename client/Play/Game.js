import { styled } from '@vanilla-bean/components';
import Phaser from 'phaser';
import gameContext from '../shared/gameContext.js';
import GameScene from './GameScene.js';

export default class Game extends (styled.Component`
	flex: 1;
	min-height: 0;
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
			height: window.innerHeight,
			scene: GameScene,
			backgroundColor: '#1a1a1a',
			physics: {
				default: 'arcade',
				arcade: {
					debug: false,
				},
			},
		});

		// The canvas fills what the view leaves it, under the toolbar and the resource bar
		this.resizeObserver = new ResizeObserver(([{ contentRect }]) => {
			if (contentRect.height) gameContext.game?.scale.resize(contentRect.width, contentRect.height);
		});
		this.resizeObserver.observe(this.elem);
	}

	destroy() {
		this.resizeObserver?.disconnect();
		if (gameContext.game) {
			gameContext.game.destroy(true);
			gameContext.game = null;
		}
		super.destroy();
	}
}
