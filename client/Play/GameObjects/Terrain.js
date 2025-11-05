import Phaser from 'phaser';
import { gridToPxPosition } from '../../../utils/index.js';
import gameContext from '../../shared/gameContext.js';

const TERRAIN_FRAME_MAP = {
	dirt: [0, 1],
	grass: [2, 3],
	water: [4, 5],
	mountain: [6, 7],
};

export default class Terrain extends Phaser.GameObjects.Sprite {
	constructor(scene, x, y, type) {
		const pos = gridToPxPosition({ x, y });

		// Pick random variant
		const frames = TERRAIN_FRAME_MAP[type] || [0];
		const frame = frames[Math.floor(Math.random() * frames.length)];

		super(scene, pos.x, pos.y, 'ground', frame);

		this.gridPosition = { x, y };
		this.type = type;

		scene.add.existing(this);
		gameContext.sceneLayers.terrain.add(this);
	}
}
