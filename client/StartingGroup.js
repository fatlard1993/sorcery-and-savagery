import {
	styled,
	Button,
	Card,
	Content,
	Elem,
	Input,
	Label,
	randFromArray,
	Toolbar,
	View,
} from '@vanilla-bean/components';
import { UNITS } from '../constants/index.js';
import { createGame, joinGame } from './api/game.js';
import gameContext from './shared/gameContext.js';
import { gold } from './shared/ui.js';

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
	return randFromArray(FANTASY_NAMES);
}

export default class StartingGroup extends styled(
	View,
	({ colors, space }) => `
		& > .variant-bar > .heading {
			color: ${gold(colors)};
		}

		& .party {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: ${space.lg};
			padding: ${space.lg} 0 ${space.xl};
			text-align: center;
		}

		& .subtitle {
			color: ${colors.muted};
		}

		& .player-name-input {
			width: 100%;
			max-width: 320px;
			text-align: left;

			& input {
				width: 100%;
				box-sizing: border-box;
			}
		}

		& .counter {
			font-size: 1.1em;
			color: ${gold(colors)};
		}

		& .unit-classes {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
			gap: ${space.md};
			width: 100%;
		}

		& .unit-card {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: ${space.sm};
		}

		& .unit-name {
			font-size: 1.15em;
			color: ${gold(colors)};
		}

		& .unit-description {
			flex: 1;
			color: ${colors.muted};
			font-size: 0.85em;
		}

		& .unit-counter {
			display: flex;
			align-items: center;
			gap: ${space.md};
		}

		& .count-display {
			font-size: 1.4em;
			color: ${gold(colors)};
			min-width: 30px;
		}
	`,
) {
	static schema = {
		playerName: {},
		// A game to join; without one, confirming creates a new game first
		gameId: {},
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
		new Toolbar({
			appendTo: this,
			variant: 'bar',
			heading: this.options.gameId ? 'Join Game' : 'Choose Your Starting Party',
		});

		const party = new Elem({ className: 'party' });

		new Content({ appendTo: this, column: 960, append: party });

		new Elem({
			appendTo: party,
			className: 'subtitle',
			textContent: `Select ${MAX_UNITS} individuals to begin your journey`,
		});

		this.nameInput = new Input({
			placeholder: 'Enter name',
			value: this.options.playerName,
			onChange: ({ value }) => {
				this.options.playerName = value;
				this.updateButton();
			},
		});

		new Label({ appendTo: party, addClass: 'player-name-input', label: 'Your Name', append: this.nameInput });

		this.counterDisplay = new Elem({
			appendTo: party,
			className: 'counter',
			textContent: `Selected: 0 / ${MAX_UNITS}`,
		});

		this.unitsContainer = new Elem({
			appendTo: party,
			className: 'unit-classes',
			append: BASE_CLASSES.map(unitType => this.createUnitCard(unitType)),
		});

		this.confirmButton = new Button({
			appendTo: party,
			content: this.options.gameId ? 'Join Game' : 'Begin Your Conquest',
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

		const card = new Card({
			addClass: 'unit-card',
			append: [
				new Elem({
					className: 'unit-name',
					textContent: unitData.name,
				}),
				new Elem({
					className: 'unit-description',
					textContent: unitData.description,
				}),
				new Elem({
					className: 'unit-counter',
					append: [
						new Button({
							icon: 'minus',
							attributes: { 'aria-label': `One fewer ${unitData.name}` },
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
							icon: 'plus',
							attributes: { 'aria-label': `One more ${unitData.name}` },
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

		const gameId =
			this.options.gameId ??
			(
				await createGame({
					body: {
						name: `${this.options.playerName}'s Realm`,
						startingUnits,
					},
				})
			).body.gameId;

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
