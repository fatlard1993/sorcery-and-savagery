import { Button, Notify, failureReason, styled } from '@vanilla-bean/components';
import { ExitDialog } from '@fatlard1993/web-game-framework/ui/GameRoom';
import { View } from '@fatlard1993/web-game-framework/ui/layout';
import { getGame } from '../api/game.js';
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
				body: { style: { display: 'flex', flexDirection: 'column' } },
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

		// Each game remembers its own player, so another game in this tab joins as someone new
		gameContext.gameId = gameId;
		gameContext.playerId = localStorage.getItem(gameId);

		if (!gameContext.playerId) {
			window.location.href = `#/join/${gameId}`;
			return;
		}

		const game = await getGame(gameId, { cache: false });

		if (game.status !== 'success') {
			new Notify({ intent: 'danger', content: failureReason(game) });
			localStorage.removeItem(gameId);
			window.location.href = '#/hub';
			return;
		}

		const player = game.body.players.find(({ id }) => id === gameContext.playerId);

		if (!player) {
			window.location.href = `#/join/${gameId}`;
			return;
		}

		if (player.choosingParty) {
			window.location.href = `#/party/${gameId}`;
			return;
		}

		// A game before this one in the tab leaves nothing behind
		for (const collection of ['players', 'units', 'buildings', 'resources', 'selectedUnits']) {
			gameContext[collection].clear();
		}
		gameContext.selectedBuilding = null;
		gameContext.serverState = game.body;
		this._toolbar.options.heading = game.body.name;

		this.socketRouter = createSocketRouter();
		this.hud = new ResourceHUD({ appendTo: this._body });
		this.game = new Game({ appendTo: this._body });
	}

	destroy() {
		this.game?.destroy();
		this.socketRouter?.destroy();
		super.destroy();
	}
}
