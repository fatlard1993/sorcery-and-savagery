import Phaser from 'phaser';
import { gridToPxPosition } from '../../../utils/index.js';
import { BUILDINGS, PLAYER_COLORS } from '../../../constants/index.js';
import gameContext from '../../shared/gameContext.js';

export default class Building extends Phaser.GameObjects.Container {
	constructor(scene, buildingData) {
		const pos = gridToPxPosition(buildingData.position);
		super(scene, pos.x, pos.y);

		this.buildingId = buildingData.id;
		this.buildingData = buildingData;
		this.gridPosition = buildingData.position;

		const stats = BUILDINGS[buildingData.type];

		// Create sprite
		this.sprite = scene.add.image(0, 0, buildingData.type);
		this.add(this.sprite);

		// Player color tint
		const playerIndex = [...gameContext.players.keys()].indexOf(buildingData.playerId);
		const playerColor = PLAYER_COLORS[playerIndex] || 0xFFFFFF;
		// this.sprite.setTint(playerColor);

		// Health bar background
		this.healthBarBg = scene.add.rectangle(
			0,
			-stats.size.height * 16 - 10,
			stats.size.width * 32,
			4,
			0x000000
		);
		this.add(this.healthBarBg);

		// Health bar
		this.healthBar = scene.add.rectangle(
			0,
			-stats.size.height * 16 - 10,
			stats.size.width * 32,
			4,
			playerColor
		);
		this.add(this.healthBar);

		this.updateHealthBar();

		// Store in game context
		gameContext.buildings.set(buildingData.id, buildingData);

		scene.add.existing(this);
		gameContext.sceneLayers.buildings.add(this);

		// Make interactive
		this.setSize(stats.size.width * 32, stats.size.height * 32);
		this.setInteractive();
	}

	updateHealthBar() {
		const stats = BUILDINGS[this.buildingData.type];
		const healthPercent = this.buildingData.health / this.buildingData.maxHealth;
		this.healthBar.width = stats.size.width * 32 * healthPercent;

		// Color based on health
		// if (healthPercent > 0.6) {
		// 	this.healthBar.setFillStyle(0x00FF00);
		// } else if (healthPercent > 0.3) {
		// 	this.healthBar.setFillStyle(0xFFFF00);
		// } else {
		// 	this.healthBar.setFillStyle(0xFF0000);
		// }
	}

	updateConstruction(progress) {
		this.buildingData.constructionProgress = progress;

		// Adjust opacity based on construction
		this.sprite.setAlpha(0.3 + progress * 0.7);
	}

	destroy() {
		gameContext.buildings.delete(this.buildingId);
		super.destroy();
	}
}
