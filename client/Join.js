import { styled, Component, Button, Elem, Input } from 'vanilla-bean-components';
import { STARTING_GROUPS } from '../constants/index.js';
import { joinGame, getGame } from './api/game.js';
import gameContext from './shared/gameContext.js';

export default class Join extends styled.Component`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100vh;
	gap: 20px;

	h1 {
		font-size: 2em;
		color: #FFD700;
		margin-bottom: 20px;
	}

	.groups {
		display: flex;
		gap: 20px;
		margin: 20px 0;
		flex-wrap: wrap;
		justify-content: center;
	}

	.group-card {
		border: 3px solid #444;
		padding: 15px;
		cursor: pointer;
		background: #222;
		min-width: 200px;

		&:hover {
			border-color: #FFD700;
		}

		&.selected {
			border-color: #00FF00;
			background: #2a3a2a;
		}
	}

	.group-name {
		font-size: 1.2em;
		color: #FFD700;
		margin-bottom: 5px;
	}

	.group-bonuses {
		color: #90EE90;
		font-size: 0.8em;
	}
` {
	constructor(options) {
		super(options);
		this.gameId = options.gameId;
		this.selectedGroup = sessionStorage.getItem('startingGroup') || null;
		this.playerName = sessionStorage.getItem('playerName') || '';
	}

	async render() {
		super.render();

		// Check if game exists
		try {
			await getGame({ gameId: this.gameId });
		} catch (error) {
			console.error('Game not found:', error);
			window.location.href = '#/';
			return;
		}

		new Elem({
			appendTo: this,
			tag: 'h1',
			textContent: 'Join Game',
		});

		this.nameInput = new Input({
			appendTo: this,
			label: 'Your Name',
			value: this.playerName,
			onChange: ({ value }) => {
				this.playerName = value;
			},
		});

		new Elem({
			appendTo: this,
			textContent: 'Choose Your Starting Group:',
			style: { marginTop: '20px', color: '#aaa' },
		});

		this.groupsContainer = new Elem({
			appendTo: this,
			className: 'groups',
			append: Object.values(STARTING_GROUPS).map((group) => {
				const card = new Component({
					className: `group-card ${this.selectedGroup === group.id ? 'selected' : ''}`,
					append: [
						new Elem({
							className: 'group-name',
							textContent: group.name,
						}),
						new Elem({
							className: 'group-bonuses',
							append: group.bonuses.map((bonus) =>
								new Elem({ textContent: `• ${bonus}` })
							),
						}),
					],
					onPointerPress: () => {
						// Remove selected class from all cards
						this.groupsContainer.elem.querySelectorAll('.group-card').forEach(c => {
							c.classList.remove('selected');
						});

						// Add selected to clicked card
						card.elem.classList.add('selected');

						this.selectedGroup = group.id;
					},
				});

				return card;
			}),
		});

		new Button({
			appendTo: this,
			content: 'Join Game',
			disabled: !this.selectedGroup || !this.playerName,
			onPointerPress: () => this.join(),
		});
	}

	async join() {
		try {
			const result = await joinGame({
				gameId: this.gameId,
				body: {
					playerName: this.playerName,
					startingGroup: this.selectedGroup,
				},
			});

			// Store in game context
			gameContext.gameId = this.gameId;
			gameContext.playerId = result.body.playerId;
			gameContext.serverState = result.body.game;

			// Navigate to game
			window.location.href = `#/play/${this.gameId}`;
		} catch (error) {
			console.error('Failed to join game:', error);
			// Redirect to home if game doesn't exist
			window.location.href = '#/';
		}
	}
}
