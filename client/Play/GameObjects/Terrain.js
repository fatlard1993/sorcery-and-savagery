import Phaser from 'phaser';
import { gridToPxPosition } from '../../../utils/index.js';
import { TERRAIN_TYPES } from '../../../constants/index.js';
import gameContext from '../../shared/gameContext.js';

const TERRAIN_FRAME_MAP = {
	dirt: [0, 1],
	grass: [2, 3],
	water: [4, 5],
	mountain: [6, 7],
};

export default class Terrain extends Phaser.GameObjects.Container {
	constructor(scene, x, y, type) {
		const pos = gridToPxPosition({ x, y });
		super(scene, pos.x, pos.y);

		this.gridPosition = { x, y };
		this.type = type;

		// Pick random variant
		const frames = TERRAIN_FRAME_MAP[type] || [0];
		const frame = frames[Math.floor(Math.random() * frames.length)];

		// Create sprite
		this.sprite = scene.add.sprite(0, 0, 'ground', frame);
		this.add(this.sprite);

		// Check if this tile is impassable
		const terrainData = TERRAIN_TYPES[type];
		const isImpassable = !terrainData?.walkable;

		// Check if there's a blocking resource here (check all tiles the resource occupies)
		const hasBlockingResource = gameContext.serverState.world.resources.some(r => {
			if (r.resourceType !== 'water' && r.resourceType !== 'stone') return false;

			// Check if this tile is within the resource's footprint
			const size = r.size || { width: 1, height: 1 };
			for (let rx = 0; rx < size.width; rx++) {
				for (let ry = 0; ry < size.height; ry++) {
					if (r.position.x + rx === x && r.position.y + ry === y) {
						return true;
					}
				}
			}
			return false;
		});

		// Add red tint overlay if impassable
		if (isImpassable || hasBlockingResource) {
			this.tintOverlay = scene.add.rectangle(0, 0, 32, 32, 0xff0000, 0.2);
			this.add(this.tintOverlay);
		}

		scene.add.existing(this);
		gameContext.sceneLayers.terrain.add(this);
	}
}
