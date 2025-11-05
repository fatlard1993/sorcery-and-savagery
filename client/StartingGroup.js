import { styled, Component, Button, Elem, Input } from 'vanilla-bean-components';
import { UNITS } from '../constants/index.js';
import { createGame, joinGame } from './api/game.js';
import gameContext from './shared/gameContext.js';

const BASE_CLASSES = ['worker', 'warrior', 'archer', 'mage', 'healer'];
const MAX_UNITS = 7;

const FANTASY_NAMES = [
	'Aldric', 'Branwen', 'Cael', 'Daveth', 'Elara', 'Finn', 'Gwendolyn',
	'Haldor', 'Isolde', 'Jorah', 'Kaelin', 'Lyra', 'Maddox', 'Nyx',
	'Orion', 'Petra', 'Quinn', 'Rowan', 'Soren', 'Thalia', 'Ulric',
	'Vex', 'Wren', 'Xander', 'Yara', 'Zephyr',
];

/**
 *
 */
function generateRandomName() {
	return FANTASY_NAMES[Math.floor(Math.random() * FANTASY_NAMES.length)];
}

export default class StartingGroup extends styled.Component`
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 40px;
	height: 100vh;
	overflow-y: auto;
	width: 100%;

	h1 {
		font-size: 2.5em;
		color: #FFD700;
		margin-bottom: 10px;
	}

	.subtitle {
		color: #aaa;
		margin-bottom: 20px;
	}

	.player-name-input {
		margin-bottom: 30px;
	}

	.counter {
		font-size: 1.2em;
		color: #FFD700;
		margin-bottom: 20px;
	}

	.unit-classes {
		display: flex;
		gap: 20px;
		margin-bottom: 30px;
		flex-wrap: wrap;
		justify-content: center;
	}

	.unit-card {
		border: 3px solid #444;
		padding: 20px;
		background: #222;
		min-width: 180px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
	}

	.unit-name {
		font-size: 1.3em;
		color: #FFD700;
	}

	.unit-description {
		color: #ccc;
		font-size: 0.85em;
		text-align: center;
		margin-bottom: 10px;
	}

	.unit-counter {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.count-button {
		width: 30px;
		height: 30px;
		background: #444;
		border: 2px solid #666;
		color: #fff;
		cursor: pointer;
		font-size: 1.2em;
		display: flex;
		align-items: center;
		justify-content: center;

		&:hover:not(:disabled) {
			background: #555;
			border-color: #FFD700;
		}

		&:disabled {
			opacity: 0.3;
			cursor: not-allowed;
		}
	}

	.count-display {
		font-size: 1.5em;
		color: #FFD700;
		min-width: 30px;
		text-align: center;
	}
` {
	constructor(options = {}) {
		super({
			...options,
			playerName: generateRandomName(),
		});

		this.playerName = this.options.playerName;
		console.log('Generated player name:', this.playerName);

		// Track count of each unit type
		this.unitCounts = {
			worker: 0,
			warrior: 0,
			archer: 0,
			mage: 0,
			healer: 0,
		};
	}

	getTotalSelected() {
		return Object.values(this.unitCounts).reduce((sum, count) => sum + count, 0);
	}

	render() {
		super.render();

		console.log('Render called, playerName is:', this.playerName);

		// If playerName isn't set yet (because super() triggered render before constructor finished),
		// use the options value
		if (!this.playerName && this.options.playerName) {
			this.playerName = this.options.playerName;
			console.log('Set playerName from options:', this.playerName);
		}

		new Elem({
			appendTo: this,
			tag: 'h1',
			textContent: 'Choose Your Starting Party',
		});

		new Elem({
			appendTo: this,
			className: 'subtitle',
			textContent: `Select ${MAX_UNITS} individuals to begin your journey`,
		});

		console.log('About to create Input with playerName:', this.playerName);

		this.nameInput = new Input({
			appendTo: this,
			className: 'player-name-input',
			label: 'Your Name',
			placeholder: this.playerName || 'Enter name',
			onChange: ({ value }) => {
				this.playerName = value;
				this.updateButton();
			},
		});

		// Set the input value after DOM is ready
		requestAnimationFrame(() => {
			const inputElem = this.nameInput.elem?.querySelector('input');
			if (inputElem) {
				inputElem.value = this.playerName;
				console.log('Set input value to:', this.playerName);
			} else {
				console.error('Could not find input element');
			}
		});

		this.counterDisplay = new Elem({
			appendTo: this,
			className: 'counter',
			textContent: `Selected: 0 / ${MAX_UNITS}`,
		});

		this.unitsContainer = new Elem({
			appendTo: this,
			className: 'unit-classes',
			append: BASE_CLASSES.map((unitType) => this.createUnitCard(unitType)),
		});

		this.confirmButton = new Button({
			appendTo: this,
			content: 'Begin Your Conquest',
			disabled: true,
			onPointerPress: () => this.confirmSelection(),
		});
	}

	updateCounter() {
		const total = this.getTotalSelected();
		this.counterDisplay.elem.textContent = `Selected: ${total} / ${MAX_UNITS}`;

		// Update button state
		this.updateButton();
	}

	updateButton() {
		if (this.confirmButton) {
			const isValid = this.getTotalSelected() === MAX_UNITS && this.playerName.trim().length > 0;
			this.confirmButton.elem.disabled = !isValid;
		}
	}

	createUnitCard(unitType) {
		const unitData = UNITS[unitType];

		// Create count display first so we can reference it
		const countDisplay = new Elem({
			className: 'count-display',
			textContent: '0',
		});

		const card = new Component({
			className: 'unit-card',
			append: [
				new Elem({
					className: 'unit-name',
					textContent: unitData.name,
				}),
				new Elem({
					className: 'unit-description',
					textContent: unitData.description,
				}),
				new Component({
					className: 'unit-counter',
					append: [
						new Button({
							className: 'count-button',
							content: '-',
							onPointerPress: () => {
								if (this.unitCounts[unitType] > 0) {
									this.unitCounts[unitType]--;
									countDisplay.elem.textContent = this.unitCounts[unitType];
									this.updateCounter();
								}
							},
						}),
						countDisplay,
						new Button({
							className: 'count-button',
							content: '+',
							onPointerPress: () => {
								if (this.getTotalSelected() < MAX_UNITS) {
									this.unitCounts[unitType]++;
									countDisplay.elem.textContent = this.unitCounts[unitType];
									this.updateCounter();
								}
							},
						}),
					],
				}),
			],
		});

		return card;
	}

	async confirmSelection() {
		// Build starting units array
		const startingUnits = [];
		Object.entries(this.unitCounts).forEach(([unitType, count]) => {
			for (let i = 0; i < count; i++) {
				startingUnits.push({ type: unitType });
			}
		});

		const createResult = await createGame({
			body: {
				name: `${this.playerName}'s Realm`,
				startingUnits,
			},
		});

		const gameId = createResult.body.gameId;

		// Immediately join the game we just created
		const joinResult = await joinGame({
			gameId,
			body: {
				playerName: this.playerName,
				startingUnits,
			},
		});

		// Store in game context
		gameContext.gameId = gameId;
		gameContext.playerId = joinResult.body.playerId;
		gameContext.serverState = joinResult.body.game;

		// Store in sessionStorage to persist across navigation
		sessionStorage.setItem('gameId', gameId);
		sessionStorage.setItem('playerId', joinResult.body.playerId);

		// Navigate directly to game
		window.location.href = `#/play/${gameId}`;
	}
}
