import { styled, Button, Elem } from '@vanilla-bean/components';
import { getGames } from './api/game.js';

export default class Hub extends (styled.Component`
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 40px;
	height: 100vh;

	& h1 {
		font-size: 2.5em;
		color: #ffd700;
		margin-bottom: 30px;
	}

	& .games-list {
		width: 100%;
		max-width: 600px;
		margin-bottom: 20px;
	}

	& .game-item {
		background: #222;
		border: 2px solid #444;
		padding: 15px;
		margin: 10px 0;
		cursor: pointer;
		transition: all 0.2s;

		&:hover {
			border-color: #ffd700;
			transform: translateX(5px);
		}
	}

	& .game-name {
		font-size: 1.2em;
		color: #ffd700;
		margin-bottom: 5px;
	}

	& .game-info {
		color: #aaa;
		font-size: 0.9em;
	}

	& .no-games {
		color: #888;
		font-style: italic;
		margin: 40px 0;
	}
`) {
	build() {
		this._init();
	}

	async _init() {
		new Elem({
			appendTo: this,
			tag: 'h1',
			textContent: 'Game Lobby',
		});

		const { response: games } = await getGames();

		this.gamesList = new Elem({
			appendTo: this,
			className: 'games-list',
			append:
				games.length === 0
					? [new Elem({ className: 'no-games', textContent: 'No active games. Create one!' })]
					: games.map(game => this.createGameItem(game)),
		});

		new Button({
			appendTo: this,
			content: 'Create New Game',
			onPointerPress: () => {
				window.location.href = '#/starting-group';
			},
		});
	}

	createGameItem(game) {
		return new Elem({
			className: 'game-item',
			append: [
				new Elem({
					className: 'game-name',
					textContent: game.name,
				}),
				new Elem({
					className: 'game-info',
					textContent: `${game.playerCount} ${game.playerCount === 1 ? 'player' : 'players'}`,
				}),
			],
			events: {
				click: () => {
					window.location.href = `#/join/${game.id}`;
				},
			},
		});
	}
}
