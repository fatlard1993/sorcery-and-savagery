import { styled, Component, Button, Elem, Input } from 'vanilla-bean-components';
import { STARTING_GROUPS } from '../constants/index.js';
import { createGame, joinGame } from './api/game.js';
import gameContext from './shared/gameContext.js';

export default class StartingGroup extends styled.Component`
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 40px;
	height: 100vh;
	overflow-y: auto;

	h1 {
		font-size: 2.5em;
		color: #FFD700;
		margin-bottom: 10px;
	}

	.subtitle {
		color: #aaa;
		margin-bottom: 30px;
	}

	.player-name-input {
		margin-bottom: 30px;
	}

	.groups {
		display: flex;
		gap: 20px;
		margin-bottom: 30px;
		flex-wrap: wrap;
		justify-content: center;
	}

	.group-card {
		border: 3px solid #444;
		padding: 20px;
		cursor: pointer;
		transition: all 0.2s;
		background: #222;
		min-width: 250px;
		max-width: 300px;

		&:hover {
			border-color: #FFD700;
			transform: translateY(-5px);
		}

		&.selected {
			border-color: #00FF00;
			background: #2a3a2a;
		}
	}

	.group-name {
		font-size: 1.5em;
		color: #FFD700;
		margin-bottom: 10px;
	}

	.group-description {
		color: #ccc;
		margin-bottom: 15px;
		font-size: 0.9em;
	}

	.group-bonuses {
		color: #90EE90;
		font-size: 0.85em;
	}

	.group-bonuses div {
		margin: 5px 0;
	}
` {
	constructor(options) {
		super(options);
		this.selectedGroup = null;
		this.playerName = '';
	}

	render() {
		super.render();

		new Elem({
			appendTo: this,
			tag: 'h1',
			textContent: 'Choose Your Starting Group',
		});

		new Elem({
			appendTo: this,
			className: 'subtitle',
			textContent: 'Your choice determines your initial infrastructure and bonuses',
		});

		this.nameInput = new Input({
			appendTo: this,
			className: 'player-name-input',
			label: 'Your Name',
			value: this.playerName,
			onChange: ({ value }) => {
				this.playerName = value;
				this.updateButton();
			},
		});

		this.groupsContainer = new Elem({
			appendTo: this,
			className: 'groups',
			append: Object.values(STARTING_GROUPS).map((group) => this.createGroupCard(group)),
		});

		this.confirmButton = new Button({
			appendTo: this,
			content: 'Begin Your Conquest',
			disabled: !this.selectedGroup || !this.playerName,
			onPointerPress: () => this.confirmSelection(),
		});
	}

	updateButton() {
		if (this.confirmButton) {
			this.confirmButton.elem.disabled = !this.selectedGroup || !this.playerName;
		}
	}

	createGroupCard(group) {
		const card = new Component({
			className: `group-card ${this.selectedGroup === group.id ? 'selected' : ''}`,
			append: [
				new Elem({
					className: 'group-name',
					textContent: group.name,
				}),
				new Elem({
					className: 'group-description',
					textContent: group.description,
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

				// Add selected class to this card
				card.elem.classList.add('selected');

				this.selectedGroup = group.id;
				this.updateButton();
			},
		});

		return card;
	}

	async confirmSelection() {
		const createResult = await createGame({
			body: {
				name: `${this.playerName}'s Realm`,
				startingGroup: this.selectedGroup,
			},
		});

		const gameId = createResult.body.gameId;

		// Immediately join the game we just created
		const joinResult = await joinGame({
			gameId,
			body: {
				playerName: this.playerName,
				startingGroup: this.selectedGroup,
			},
		});

		// Store in game context
		gameContext.gameId = gameId;
		gameContext.playerId = joinResult.body.playerId;
		gameContext.serverState = joinResult.body.game;

		// Store in sessionStorage to persist across navigation
		sessionStorage.setItem('gameId', gameId);
		sessionStorage.setItem('playerId', joinResult.body.playerId);
		sessionStorage.setItem('serverState', JSON.stringify(joinResult.body.game));

		// Navigate directly to game
		window.location.href = `#/play/${gameId}`;
	}
}
