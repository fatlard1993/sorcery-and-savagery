import { styled, Component } from 'vanilla-bean-components';
import Game from './Game.js';
import ResourceHUD from './ResourceHUD.js';
import { onMessage } from '../../byod-web-game/client/socket.js';
import socketRouter from './socketRouter/index.js';
import gameContext from '../shared/gameContext.js';

export default class Play extends styled.Component`
	display: flex;
	flex-direction: column;
	width: 100vw;
	height: 100vh;
	background: #1a1a1a;
` {
	constructor(options) {
		super(options);
		console.log('Play constructor called with options:', options);

		this.gameId = options.gameId;
		gameContext.gameId = this.gameId;
		gameContext.playerId = sessionStorage.getItem('playerId');

		console.log('Will fetch fresh game state from server');
	}

	async loadGameState() {
		// Fetch fresh game state from server
		const { getGame } = await import('../api/game.js');
		const result = await getGame({ gameId: this.gameId });

		gameContext.serverState = result.body;
		console.log('Loaded fresh game state:', gameContext.serverState);
	}

	async render() {
		console.log('Play render() called');
		super.render();

		// Load fresh game state before initializing
		await this.loadGameState();

		// Set up socket message handler
		this.socketCleanup = onMessage(socketRouter);

		// Resource HUD at top
		this.hud = new ResourceHUD({
			appendTo: this,
		});

		// Phaser game canvas
		this.game = new Game({
			appendTo: this,
		});
	}

	destroy() {
		if (this.game) {
			this.game.destroy();
		}
		if (this.socketCleanup) {
			this.socketCleanup();
		}
		super.destroy();
	}
}
