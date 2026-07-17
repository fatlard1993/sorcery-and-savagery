import { styled } from '@vanilla-bean/components';
import gameContext from '../shared/gameContext.js';
import Game from './Game.js';
import ResourceHUD from './ResourceHUD.js';
import createSocketRouter from './socketRouter/index.js';

export default class Play extends (styled.Component`
	display: flex;
	flex-direction: column;
	width: 100vw;
	height: 100vh;
	background: #1a1a1a;
`) {
	static schema = {
		gameId: {},
	};

	constructor(options) {
		super(options);

		this.gameId = options.gameId;
		gameContext.gameId = this.gameId;
		gameContext.playerId = sessionStorage.getItem('playerId');
	}

	async loadGameState() {
		// Fetch fresh game state from server
		const { getGame } = await import('../api/game.js');
		try {
			const result = await getGame({ gameId: this.gameId });

			// Check if request failed
			if (result.status !== 'success') {
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

	build() {
		this._init();
	}

	async _init() {
		console.log('Play _init() called');

		// Load fresh game state before initializing
		const loaded = await this.loadGameState();
		if (!loaded) return; // Stop rendering if game failed to load

		// Set up socket message routing
		this.socketRouter = createSocketRouter();

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
		if (this.socketRouter) {
			this.socketRouter.destroy();
		}
		super.destroy();
	}
}
