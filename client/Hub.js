import { styled, Button, Card, Content, Elem, EmptyState, Toolbar, View } from '@vanilla-bean/components';

import { getGames } from './api/game.js';
import { gold } from './shared/ui.js';

export default class Hub extends styled(
	View,
	({ colors, space }) => `
		& > .variant-bar > .heading {
			color: ${gold(colors)};
		}

		& .games-list {
			display: flex;
			flex-direction: column;
			gap: ${space.sm};
			padding: ${space.lg} 0;
		}

		& .game-name {
			font-size: 1.1em;
			color: ${gold(colors)};
			margin-bottom: ${space.xs};
		}

		& .game-info {
			color: ${colors.muted};
			font-size: 0.9em;
		}
	`,
) {
	build() {
		new Toolbar({
			appendTo: this,
			variant: 'bar',
			heading: 'Game Lobby',
			append: new Button({
				content: 'Create New Game',
				onPointerPress: () => {
					window.location.href = '#/starting-group';
				},
			}),
		});

		this.content = new Content({ appendTo: this, column: 600 });

		this._init();
	}

	async _init() {
		const { body: games } = await getGames();

		this.content.append(
			games.length === 0
				? new EmptyState({ icon: 'chess-rook', title: 'No active games', message: 'Create one to start a realm.' })
				: new Elem({ className: 'games-list', append: games.map(game => this.createGameItem(game)) }),
		);
	}

	createGameItem(game) {
		return new Card({
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
			onPointerPress: () => {
				window.location.href = `#/join/${game.id}`;
			},
		});
	}
}
