import { styled, Component } from 'vanilla-bean-components';
import Phaser from 'phaser';
import gameContext from '../shared/gameContext.js';
import GameScene from './GameScene.js';

export default class Game extends styled.Component`
	flex: 1;
	width: 100%;
	overflow: hidden;

	canvas {
		display: block !important;
		width: 100% !important;
		height: 100% !important;
	}
` {
	constructor(options = {}) {
		super(options);
		console.log('Game component constructor');
		console.log('this.elem exists:', !!this.elem);
		console.log('this.elem parent:', this.elem?.parentElement);
	}

	render() {
		super.render();
		console.log('Game render - creating Phaser');
		console.log('this.elem:', this.elem);
		console.log('this.elem in DOM:', document.body.contains(this.elem));

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

		console.log('Phaser game created');

		// Handle window resize
		window.addEventListener('resize', this.handleResize);
	}

	handleResize = () => {
		if (gameContext.game) {
			gameContext.game.scale.resize(
				window.innerWidth,
				window.innerHeight - 60
			);
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
