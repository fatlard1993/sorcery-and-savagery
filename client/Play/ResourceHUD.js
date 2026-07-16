import { styled, Elem } from '@vanilla-bean/components';
import { RESOURCE_COLORS } from '../../constants/index.js';
import gameContext from '../shared/gameContext.js';

export default class ResourceHUD extends (styled.Component`
	display: flex;
	justify-content: space-around;
	align-items: center;
	padding: 10px 20px;
	background: rgba(0, 0, 0, 0.8);
	border-bottom: 2px solid #444;
	height: 60px;

	& .resource {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 1.1em;
	}

	& .resource-icon {
		width: 20px;
		height: 20px;
		border-radius: 3px;
	}

	& .resource-amount {
		color: #ffd700;
		font-weight: bold;
		min-width: 60px;
	}

	& .population {
		color: #fff;
	}
`) {
	build() {
		// Update every second
		this.updateInterval = setInterval(() => this.updateResources(), 1000);

		this.updateResources();
	}

	updateResources() {
		const player = gameContext.players.currentPlayer;
		if (!player) return;

		this.elem.innerHTML = '';

		// Wood
		new Elem({
			appendTo: this,
			className: 'resource',
			append: [
				new Elem({
					className: 'resource-icon',
					style: { backgroundColor: `#${RESOURCE_COLORS.wood.toString(16)}` },
				}),
				new Elem({
					className: 'resource-amount',
					textContent: Math.floor(player.resources.wood),
				}),
			],
		});

		// Stone
		new Elem({
			appendTo: this,
			className: 'resource',
			append: [
				new Elem({
					className: 'resource-icon',
					style: { backgroundColor: `#${RESOURCE_COLORS.stone.toString(16)}` },
				}),
				new Elem({
					className: 'resource-amount',
					textContent: Math.floor(player.resources.stone),
				}),
			],
		});

		// Iron
		new Elem({
			appendTo: this,
			className: 'resource',
			append: [
				new Elem({
					className: 'resource-icon',
					style: { backgroundColor: `#${RESOURCE_COLORS.iron.toString(16)}` },
				}),
				new Elem({
					className: 'resource-amount',
					textContent: Math.floor(player.resources.iron),
				}),
			],
		});

		// Water
		new Elem({
			appendTo: this,
			className: 'resource',
			append: [
				new Elem({
					className: 'resource-icon',
					style: { backgroundColor: `#${RESOURCE_COLORS.water.toString(16)}` },
				}),
				new Elem({
					className: 'resource-amount',
					textContent: Math.floor(player.resources.water),
				}),
			],
		});

		// Food
		new Elem({
			appendTo: this,
			className: 'resource',
			append: [
				new Elem({
					className: 'resource-icon',
					style: { backgroundColor: `#${RESOURCE_COLORS.food.toString(16)}` },
				}),
				new Elem({
					className: 'resource-amount',
					textContent: Math.floor(player.resources.food),
				}),
			],
		});

		// Population
		new Elem({
			appendTo: this,
			className: 'resource population',
			textContent: `Population: ${player.population.current}/${player.population.max}`,
		});
	}

	destroy() {
		if (this.updateInterval) {
			clearInterval(this.updateInterval);
		}
		super.destroy();
	}
}
