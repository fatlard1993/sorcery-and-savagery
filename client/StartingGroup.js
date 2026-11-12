import { styled, Button, Card, Content, Elem, Notify, Toolbar, View } from '@vanilla-bean/components';
import { act, enterGame } from '@fatlard1993/web-game-framework/client';
import { STARTING_PARTY_SIZE, UNITS } from '../constants/index.js';
import { gold } from './shared/ui.js';

const BASE_CLASSES = ['worker', 'warrior', 'archer', 'mage', 'healer'];

export default class StartingGroup extends styled(
	View,
	({ colors, fontSize, space }) => `
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

		& .counter {
			font-size: ${fontSize.lg};
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
			font-size: ${fontSize.lg};
			color: ${gold(colors)};
		}

		& .unit-description {
			flex: 1;
			color: ${colors.muted};
			font-size: ${fontSize.sm};
		}

		& .unit-counter {
			display: flex;
			align-items: center;
			gap: ${space.md};
		}

		& .count-display {
			font-size: ${fontSize.xxl};
			color: ${gold(colors)};
			min-width: 30px;
		}
	`,
) {
	static schema = {
		// The game joined; the party is this tab's player in it
		gameId: {},
	};

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
		this.playerId = localStorage.getItem(this.options.gameId);

		new Toolbar({ appendTo: this, variant: 'bar', heading: 'Choose Your Starting Party' });

		const party = new Elem({ className: 'party' });

		new Content({ appendTo: this, column: 960, append: party });

		new Elem({
			appendTo: party,
			className: 'subtitle',
			textContent: `Select ${STARTING_PARTY_SIZE} individuals to begin your journey`,
		});

		this.counterDisplay = new Elem({
			appendTo: party,
			className: 'counter',
			textContent: `Selected: 0 / ${STARTING_PARTY_SIZE}`,
		});

		this.unitsContainer = new Elem({
			appendTo: party,
			className: 'unit-classes',
			append: BASE_CLASSES.map(unitType => this.createUnitCard(unitType)),
		});

		this.confirmButton = new Button({
			appendTo: party,
			content: 'Begin your conquest',
			disabled: true,
			onPointerPress: () => this.confirmSelection(),
		});

		this._checkPlayer();
	}

	// Only a player of this game still choosing has a party to pick; anyone else goes where they belong. The page is in
	// the game from here, so choosing is an action as that player.
	async _checkPlayer() {
		const { gameId } = this.options;

		if (!this.playerId) {
			window.location.href = `#/join/${gameId}`;
			return;
		}

		const { game, leave } = await enterGame(gameId, {
			notMember: () => (window.location.href = `#/join/${gameId}`),
			gone: () => {
				new Notify({ intent: 'danger', content: 'That game is gone' });
				window.location.href = '#/hub';
			},
		});

		if (!game) return;

		this.addCleanup('game', leave);

		if (!game.players.find(({ id }) => id === this.playerId)?.choosingParty) window.location.href = `#/play/${gameId}`;
	}

	updateCounter() {
		const total = this.getTotalSelected();
		this.counterDisplay.elem.textContent = `Selected: ${total} / ${STARTING_PARTY_SIZE}`;

		// Update button state
		this.updateButton();
	}

	updateButton() {
		if (this.confirmButton) {
			this.confirmButton.options.disabled = this.getTotalSelected() !== STARTING_PARTY_SIZE;
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
							variant: 'flat',
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
							variant: 'flat',
							attributes: { 'aria-label': `One more ${unitData.name}` },
							onPointerPress: () => {
								if (this.getTotalSelected() < STARTING_PARTY_SIZE) {
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

		// A refusal is shown by act, and the party stays to be chosen again
		if ((await act('chooseStartingParty', { startingUnits })).ok)
			window.location.href = `#/play/${this.options.gameId}`;
	}
}
