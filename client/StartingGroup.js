import { styled, Component, Button, Elem, Input } from '@vanilla-bean/components';
import { UNITS } from '../constants/index.js';
import { createGame, joinGame } from './api/game.js';
import gameContext from './shared/gameContext.js';

const BASE_CLASSES = ['worker', 'warrior', 'archer', 'mage', 'healer'];
const MAX_UNITS = 7;

const FANTASY_NAMES = [
	'Aldric',
	'Branwen',
	'Cael',
	'Daveth',
	'Elara',
	'Finn',
	'Gwendolyn',
	'Haldor',
	'Isolde',
	'Jorah',
	'Kaelin',
	'Lyra',
	'Maddox',
	'Nyx',
	'Orion',
	'Petra',
	'Quinn',
	'Rowan',
	'Soren',
	'Thalia',
	'Ulric',
	'Vex',
	'Wren',
	'Xander',
	'Yara',
	'Zephyr',
];

function generateRandomName() {
	return FANTASY_NAMES[Math.floor(Math.random() * FANTASY_NAMES.length)];
}

export default class StartingGroup extends (styled.Component`
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 40px;
	height: 100vh;
	overflow-y: auto;
	width: 100%;

	& h1 {
		font-size: 2.5em;
		color: #ffd700;
		margin-bottom: 10px;
	}

	& .subtitle {
		color: #aaa;
		margin-bottom: 20px;
	}

	& .player-name-input {
		margin-bottom: 30px;
	}

	& .counter {
		font-size: 1.2em;
		color: #ffd700;
		margin-bottom: 20px;
	}

	& .unit-classes {
		display: flex;
		gap: 20px;
		margin-bottom: 30px;
		flex-wrap: wrap;
		justify-content: center;
	}

	& .unit-card {
		border: 3px solid #444;
		padding: 20px;
		background: #222;
		min-width: 180px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
	}

	& .unit-name {
		font-size: 1.3em;
		color: #ffd700;
	}

	& .unit-description {
		color: #ccc;
		font-size: 0.85em;
		text-align: center;
		margin-bottom: 10px;
	}

	& .unit-counter {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	& .count-button {
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
			border-color: #ffd700;
		}

		&:disabled {
			opacity: 0.3;
			cursor: not-allowed;
		}
	}

	& .count-display {
		font-size: 1.5em;
		color: #ffd700;
		min-width: 30px;
		text-align: center;
	}
`) {
	static schema = {
		playerName: {},
	};

	static prepareOptions(options) {
		return { playerName: generateRandomName(), ...options };
	}

	constructor(options = {}) {
		super(options);

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

	build() {
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

		this.nameInput = new Input({
			appendTo: this,
			className: 'player-name-input',
			label: 'Your Name',
			placeholder: 'Enter name',
			value: this.options.playerName,
			onChange: ({ value }) => {
				this.options.playerName = value;
				this.updateButton();
			},
		});

		this.counterDisplay = new Elem({
			appendTo: this,
			className: 'counter',
			textContent: `Selected: 0 / ${MAX_UNITS}`,
		});

		this.unitsContainer = new Elem({
			appendTo: this,
			className: 'unit-classes',
			append: BASE_CLASSES.map(unitType => this.createUnitCard(unitType)),
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
			const isValid = this.getTotalSelected() === MAX_UNITS && this.options.playerName.trim().length > 0;
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
				name: `${this.options.playerName}'s Realm`,
				startingUnits,
			},
		});

		const gameId = createResult.body.gameId;

		// Immediately join the game we just created
		const joinResult = await joinGame({
			gameId,
			body: {
				playerName: this.options.playerName,
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
