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
		// For house, pick random variant (0, 1, or 2)
		if (buildingData.type === 'house') {
			const frame = Math.floor(Math.random() * 3);
			this.sprite = scene.add.sprite(0, 0, buildingData.type, frame);
		} else {
			this.sprite = scene.add.image(0, 0, buildingData.type);
		}
		// Scale sprite to 2x grid size for better visibility (each tile is 32px, multiply by 2)
		this.sprite.setDisplaySize(stats.size.width * 64, stats.size.height * 64);
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

		// Health bar frame
		this.healthBarFrame = scene.add.rectangle(
			0,
			-stats.size.height * 16 - 10,
			stats.size.width * 32,
			4
		);
		this.healthBarFrame.setStrokeStyle(1, 0xffffff, 0.8);
		this.healthBarFrame.setFillStyle(0x000000, 0);
		this.add(this.healthBarFrame);

		// Construction progress bar (yellow, above health bar)
		// Use origin 0,0.5 for left-aligned bars
		this.constructionBarBg = scene.add.rectangle(
			-stats.size.width * 16,
			-stats.size.height * 16 - 18,
			stats.size.width * 32,
			6,
			0x000000
		);
		this.constructionBarBg.setOrigin(0, 0.5);
		this.add(this.constructionBarBg);

		this.constructionBar = scene.add.rectangle(
			-stats.size.width * 16,
			-stats.size.height * 16 - 18,
			0, // Start at 0 width
			6,
			0xFFD700
		);
		this.constructionBar.setOrigin(0, 0.5);
		this.add(this.constructionBar);

		this.constructionBarFrame = scene.add.rectangle(
			-stats.size.width * 16,
			-stats.size.height * 16 - 18,
			stats.size.width * 32,
			6
		);
		this.constructionBarFrame.setOrigin(0, 0.5);
		this.constructionBarFrame.setStrokeStyle(1, 0xffffff, 0.8);
		this.constructionBarFrame.setFillStyle(0x000000, 0);
		this.add(this.constructionBarFrame);

		this.updateHealthBar();
		this.updateConstruction(buildingData.constructionProgress || 0);

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

		// 50% opacity while under construction, 100% when done
		this.sprite.setAlpha(progress >= 1.0 ? 1.0 : 0.5);

		// Update construction progress bar
		const stats = BUILDINGS[this.buildingData.type];
		this.constructionBar.width = stats.size.width * 32 * progress;

		// Hide construction bars when complete
		if (progress >= 1.0) {
			this.constructionBarBg.setVisible(false);
			this.constructionBar.setVisible(false);
			this.constructionBarFrame.setVisible(false);
		} else {
			this.constructionBarBg.setVisible(true);
			this.constructionBar.setVisible(true);
			this.constructionBarFrame.setVisible(true);
		}
	}

	destroy() {
		gameContext.buildings.delete(this.buildingId);
		super.destroy();
	}
}
