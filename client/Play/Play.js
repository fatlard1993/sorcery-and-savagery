import { styled, Component } from 'vanilla-bean-components';
import { onMessage } from '../../byod-web-game/client/socket.js';
import gameContext from '../shared/gameContext.js';
import Game from './Game.js';
import ResourceHUD from './ResourceHUD.js';
import socketRouter from './socketRouter/index.js';

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
		try {
			const result = await getGame({ gameId: this.gameId });

			// Check if request failed
			if (!result.success) {
				console.error('Game not found');
				window.location.href = '#/';
				return false;
			}

			gameContext.serverState = result.body;
			console.log('Loaded fresh game state:', gameContext.serverState);
			return true;
		} catch (error) {
			console.error('Failed to load game:', error);
			// Redirect to home if game doesn't exist
			window.location.href = '#/';
			return false;
		}
	}

	async render() {
		console.log('Play render() called');
		super.render();

		// Load fresh game state before initializing
		const loaded = await this.loadGameState();
		if (!loaded) return; // Stop rendering if game failed to load

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
