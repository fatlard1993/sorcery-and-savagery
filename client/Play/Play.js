import { Button, Notify, styled } from '@vanilla-bean/components';
import { enterGame } from '@fatlard1993/web-game-framework/client';
import { ExitDialog } from '@fatlard1993/web-game-framework/ui/GameRoom';
import { View } from '@fatlard1993/web-game-framework/ui/layout';
import gameContext from '../shared/gameContext.js';
import { goldHeading } from '../shared/ui.js';
import Game from './Game.js';
import ResourceHUD from './ResourceHUD.js';
import createSocketRouter from './socketRouter/index.js';

export default class Play extends styled(View, goldHeading) {
	static schema = {
		gameId: {},
	};

	constructor(options, ...children) {
		super(
			{
				...options,
				toolbar: {
					heading: '',
					left: [
						new Button({
							content: 'Exit',
							onPointerPress: () => new ExitDialog({ gameId: gameContext.gameId, playerId: gameContext.playerId }),
						}),
					],
				},
			},
			...children,
		);
	}

	build() {
		super.build();
		this._init();
	}

	async _init() {
		const { gameId } = this.options;

		// A game before this one in the tab leaves nothing behind
		for (const collection of ['players', 'units', 'buildings', 'resources', 'selectedUnits']) {
			gameContext[collection].clear();
		}
		gameContext.selectedBuilding = null;
		gameContext.serverState = null;

		// The page says it's here as this tab's player in the game (each game remembers its own player, so another game in
		// this tab joins as someone new), and is sent the players again whenever they change
		const { game, leave } = await enterGame(gameId, {
			onState: ({ players }) => this.showPlayers(players),
			notMember: () => (window.location.href = `#/join/${gameId}`),
			gone: () => {
				new Notify({ intent: 'danger', content: 'That game is gone' });
				localStorage.removeItem(gameId);
				window.location.href = '#/hub';
			},
		});

		if (!game) return;

		if (game.players.find(({ id }) => id === gameContext.playerId)?.choosingParty) {
			leave();
			window.location.href = `#/party/${gameId}`;
			return;
		}

		this.addCleanup('game', leave);
		// The map, units and buildings as fetched; they change from there by the game's broadcasts (socketRouter)
		gameContext.serverState = game;
		this._toolbar.options.heading = game.name;

		this.socketRouter = createSocketRouter();
		this.hud = new ResourceHUD({ appendTo: this._body });
		this.game = new Game({ appendTo: this._body });
	}

	// Each player as this page may see them: its own with resources and party, the others without
	showPlayers(players) {
		gameContext.players.clear();
		for (const player of players) gameContext.players.set(player.id, player);
		if (gameContext.serverState) gameContext.serverState.players = players;
		this.hud?.updateResources();
	}

	destroy() {
		this.game?.destroy();
		this.socketRouter?.destroy();
		super.destroy();
	}
}
