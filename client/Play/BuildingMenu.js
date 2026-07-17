import { styled, Component, Button, Elem } from '@vanilla-bean/components';
import { BUILDINGS } from '../../constants/index.js';
import gameContext from '../shared/gameContext.js';

export default class BuildingMenu extends (styled.Component`
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	background: #1a1a1a;
	border: 3px solid #ffd700;
	padding: 30px;
	z-index: 1000;
	max-width: 600px;
	max-height: 80vh;
	overflow-y: auto;

	& h2 {
		color: #ffd700;
		margin-bottom: 20px;
		text-align: center;
	}

	& .buildings-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 15px;
		margin-bottom: 20px;
	}

	& .building-card {
		border: 2px solid #444;
		padding: 15px;
		background: #222;
		cursor: pointer;
		transition: all 0.2s;

		&:hover {
			border-color: #ffd700;
			transform: translateY(-2px);
		}

		&.disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

	& .building-name {
		font-size: 1.2em;
		color: #ffd700;
		margin-bottom: 8px;
	}

	& .building-cost {
		color: #90ee90;
		font-size: 0.9em;
		margin: 4px 0;
	}

	& .building-cost.insufficient {
		color: #ff6666;
	}

	& .close-button {
		margin-top: 15px;
		width: 100%;
	}
`) {
	static schema = {
		onSelect: {},
	};

	constructor(options) {
		super(options);
		this.onSelect = options.onSelect;
	}

	build() {
		new Elem({
			appendTo: this,
			tag: 'h2',
			textContent: 'Select Building to Construct',
		});

		const player = gameContext.players.get(gameContext.playerId);
		const unlockedBuildings = player?.techTree?.unlocked || [];

		new Elem({
			appendTo: this,
			className: 'buildings-grid',
			append: unlockedBuildings
				.map(buildingType => {
					const buildingData = BUILDINGS[buildingType];
					if (!buildingData) return null;

					const canAfford = this.canAffordBuilding(buildingData, player);

					const card = new Component({
						className: `building-card ${!canAfford ? 'disabled' : ''}`,
						append: [
							new Elem({
								className: 'building-name',
								textContent: buildingData.name,
							}),
							new Elem({
								textContent: buildingData.description,
								style: { color: '#ccc', fontSize: '0.85em', marginBottom: '10px' },
							}),
							...Object.entries(buildingData.cost).map(([resource, amount]) => {
								const hasEnough = player.resources[resource] >= amount;
								return new Elem({
									className: `building-cost ${!hasEnough ? 'insufficient' : ''}`,
									textContent: `${resource}: ${amount} (have: ${Math.floor(player.resources[resource])})`,
								});
							}),
						],
						onPointerPress: () => {
							if (canAfford) {
								this.onSelect(buildingType);
								this.destroy();
							}
						},
					});

					return card;
				})
				.filter(Boolean),
		});

		new Button({
			appendTo: this,
			className: 'close-button',
			content: 'Cancel',
			onPointerPress: () => this.destroy(),
		});
	}

	canAffordBuilding(buildingData, player) {
		return Object.entries(buildingData.cost).every(([resource, amount]) => player.resources[resource] >= amount);
	}

	destroy() {
		// Clear the active menu reference
		if (gameContext.activeBuildingMenu === this) {
			gameContext.activeBuildingMenu = null;
		}

		// Remove from DOM
		if (this.elem && this.elem.parentNode) {
			this.elem.parentNode.removeChild(this.elem);
		}
	}
}
