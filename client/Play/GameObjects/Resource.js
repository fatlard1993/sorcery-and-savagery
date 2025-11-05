import Phaser from 'phaser';
import { gridToPxPosition } from '../../../utils/index.js';
import gameContext from '../../shared/gameContext.js';

export default class Resource extends Phaser.GameObjects.Sprite {
	constructor(scene, resourceData) {
		const pos = gridToPxPosition(resourceData.position);

		// Pick random variant (0, 1, or 2)
		const frame = Math.floor(Math.random() * 3);

		super(scene, pos.x, pos.y, resourceData.type, frame);

		this.resourceId = resourceData.id;
		this.resourceData = resourceData;
		this.gridPosition = resourceData.position;

		// Store in game context
		gameContext.resources.set(resourceData.id, resourceData);

		scene.add.existing(this);
		gameContext.sceneLayers.resources.add(this);
	}

	updateAmount(newAmount) {
		this.resourceData.amount = newAmount;

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
