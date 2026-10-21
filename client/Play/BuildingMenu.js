import { styled, Dialog, Elem } from '@vanilla-bean/components';
import { BUILDINGS } from '../../constants/index.js';
import gameContext from '../shared/gameContext.js';
import { CardButton, gold } from '../shared/ui.js';

export default class BuildingMenu extends styled(
	Dialog,
	({ colors, space }) => `
		& .buildings-grid {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
			gap: ${space.sm};
		}

		& .building-name {
			font-size: 1.1em;
			color: ${gold(colors)};
			margin-bottom: ${space.xs};
		}

		& .building-description {
			color: ${colors.muted};
			font-size: 0.85em;
			margin-bottom: ${space.sm};
		}

		& .building-cost {
			color: ${colors.light(colors.success)};
			font-size: 0.9em;
			margin: 2px 0;
		}

		& .building-cost.insufficient {
			color: ${colors.light(colors.danger)};
		}
	`,
) {
	static schema = {
		onSelect: {},
	};

	constructor(options) {
		super({
			size: 'fit',
			header: 'Select Building to Construct',
			buttons: ['Cancel'],
			onButtonPress: () => this.close(),
			...options,
		});
		this.onSelect = options.onSelect;
	}

	build() {
		super.build();

		const player = gameContext.players.get(gameContext.playerId);
		const unlockedBuildings = player?.techTree?.unlocked || [];

		new Elem({
			appendTo: this.body,
			className: 'buildings-grid',
			append: unlockedBuildings
				.map(buildingType => {
					const buildingData = BUILDINGS[buildingType];
					if (!buildingData) return null;

					const canAfford = this.canAffordBuilding(buildingData, player);

					return new CardButton({
						disabled: !canAfford,
						append: [
							new Elem({
								className: 'building-name',
								textContent: buildingData.name,
							}),
							new Elem({
								className: 'building-description',
								textContent: buildingData.description,
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
								this.close();
							}
						},
					});
				})
				.filter(Boolean),
		});
	}

	canAffordBuilding(buildingData, player) {
		return Object.entries(buildingData.cost).every(([resource, amount]) => player.resources[resource] >= amount);
	}

	destroy() {
		if (gameContext.activeBuildingMenu === this) gameContext.activeBuildingMenu = null;

		super.destroy();
	}
}
