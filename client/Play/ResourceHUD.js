import { styled, Component, Elem } from '@vanilla-bean/components';
import { RESOURCE_COLORS } from '../../constants/index.js';
import gameContext from '../shared/gameContext.js';
import { gold } from '../shared/ui.js';

// The bar keeps one height, wrapping inside it, so the map below it doesn't jump
export default class ResourceHUD extends styled(
	Component,
	({ colors, space, radius, media }) => `
		display: flex;
		flex-wrap: wrap;
		justify-content: space-around;
		align-items: center;
		align-content: center;
		gap: 2px ${space.lg};
		box-sizing: border-box;
		height: 60px;
		flex-shrink: 0;
		padding: ${space.xs} ${space.md};
		overflow: hidden;
		background-color: ${colors.surface};
		border-bottom: 1px solid ${colors.border};

		@media ${media.phone} {
			gap: 2px ${space.md};
			font-size: 0.85em;
		}

		& .resource {
			display: flex;
			align-items: center;
			gap: ${space.sm};
			font-size: 1.1em;
		}

		& .resource-icon {
			width: 1em;
			height: 1em;
			border-radius: ${radius.sm};
		}

		& .resource-amount {
			color: ${gold(colors)};
			font-weight: 600;
			min-width: 2.5em;
		}

		& .population {
			color: ${colors.white};
		}
	`,
) {
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
