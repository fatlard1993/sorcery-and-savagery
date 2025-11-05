import Phaser from 'phaser';
import { gridToPxPosition } from '../../../utils/index.js';
import { RESOURCE_TYPES } from '../../../constants/index.js';
import gameContext from '../../shared/gameContext.js';

export default class Resource extends Phaser.GameObjects.Container {
	constructor(scene, resourceData) {
		// Position at center of resource footprint (not top-left corner)
		const size = resourceData.size || { width: 1, height: 1 };
		// For even-sized resources (2x2), we want the pixel center between tiles
		// For odd-sized (3x3), we want the center tile
		const centerOffset = (size.width - 1) / 2;
		const pxPos = {
			x: (resourceData.position.x + centerOffset) * 32 + 16,
			y: (resourceData.position.y + centerOffset) * 32 + 16,
		};

		super(scene, pxPos.x, pxPos.y);

		this.resourceId = resourceData.id;
		this.resourceData = resourceData;
		this.gridPosition = resourceData.position;
		this.hasBeenGathered = false; // Track if gathering has started

		// Pick random variant (0, 1, or 2) - skip frame 1 for water
		let frame = Math.floor(Math.random() * 3);
		if (resourceData.resourceType === 'water' && frame === 1) {
			frame = Math.random() < 0.5 ? 0 : 2; // Use 0 or 2 instead
		}

		// Create sprite
		this.sprite = scene.add.sprite(0, 0, resourceData.type, frame);
		// Scale based on resource size (with 10% extra for water)
		const displaySize = size.width * 32;
		const scale = resourceData.resourceType === 'water' ? 1.1 : 1.0;
		this.sprite.setDisplaySize(displaySize * scale, displaySize * scale);
		this.add(this.sprite);

		// Health bar background (starts hidden)
		const barYOffset = -(displaySize / 2) - 7;
		this.healthBarBg = scene.add.rectangle(0, barYOffset, displaySize, 6, 0x000000, 0.7);
		this.healthBarBg.setVisible(false);
		this.add(this.healthBarBg);

		// Health bar (starts hidden)
		this.healthBar = scene.add.rectangle(0, barYOffset, displaySize, 6, 0x00ff00);
		this.healthBar.setVisible(false);
		this.add(this.healthBar);

		// Health bar frame (starts hidden)
		this.healthBarFrame = scene.add.rectangle(0, barYOffset, displaySize, 6);
		this.healthBarFrame.setStrokeStyle(1, 0xffffff, 0.8);
		this.healthBarFrame.setFillStyle(0x000000, 0);
		this.healthBarFrame.setVisible(false);
		this.add(this.healthBarFrame);

		// Store displaySize for updateHealthBar
		this.displaySize = displaySize;

		// Store in game context
		gameContext.resources.set(resourceData.id, resourceData);

		scene.add.existing(this);
		gameContext.sceneLayers.resources.add(this);
	}

	updateHealthBar() {
		const resourceStats = RESOURCE_TYPES[this.resourceData.type];
		const maxAmount = resourceStats.maxAmount;
		const currentAmount = this.resourceData.amount;

		// Don't show health bar for infinite resources (water)
		if (maxAmount === Infinity) {
			return;
		}

		// Show health bar once gathering has started
		if (!this.hasBeenGathered && currentAmount < maxAmount) {
			this.hasBeenGathered = true;
			this.healthBarBg.setVisible(true);
			this.healthBar.setVisible(true);
			this.healthBarFrame.setVisible(true);
		}

		// Update health bar width and color
		if (this.hasBeenGathered) {
			const percentage = currentAmount / maxAmount;
			this.healthBar.width = this.displaySize * percentage;

			// Color based on depletion: green -> yellow -> red
			if (percentage > 0.6) {
				this.healthBar.setFillStyle(0x00ff00); // Green
			} else if (percentage > 0.3) {
				this.healthBar.setFillStyle(0xffff00); // Yellow
			} else {
				this.healthBar.setFillStyle(0xff0000); // Red
			}
		}
	}

	updateAmount(newAmount) {
		this.resourceData.amount = newAmount;

		// Update health bar
		this.updateHealthBar();

		// Destroy if depleted
		if (newAmount <= 0 && newAmount !== Infinity) {
			this.destroy();
		}
	}

	destroy() {
		gameContext.resources.delete(this.resourceId);
		super.destroy();
	}
}
