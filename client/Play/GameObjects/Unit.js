import Phaser from 'phaser';
import { gridToPxPosition } from '../../../utils/index.js';
import { UNITS, PLAYER_COLORS } from '../../../constants/index.js';
import gameContext from '../../shared/gameContext.js';

export default class Unit extends Phaser.GameObjects.Container {
	constructor(scene, unitData) {
		const pos = gridToPxPosition(unitData.position);
		super(scene, pos.x, pos.y);

		this.unitId = unitData.id;
		this.unitData = unitData;
		this.gridPosition = unitData.position;

		// Create sprite
		this.sprite = scene.add.image(0, 0, unitData.type);
		this.sprite.setDisplaySize(32, 32);
		this.add(this.sprite);

		// Store player color
		const playerIndex = [...gameContext.players.keys()].indexOf(unitData.playerId);
		this.playerColor = PLAYER_COLORS[playerIndex] || 0xffffff;

		// Health bar background (positioned lower to stay within grid space)
		this.healthBarBg = scene.add.rectangle(0, -13, 32, 3, 0x000000);
		this.add(this.healthBarBg);

		// Health bar
		this.healthBar = scene.add.rectangle(0, -13, 32, 3, this.playerColor);
		this.add(this.healthBar);

		// Health bar frame
		this.healthBarFrame = scene.add.rectangle(0, -13, 32, 3);
		this.healthBarFrame.setStrokeStyle(1, 0xffffff, 0.8);
		this.healthBarFrame.setFillStyle(0x000000, 0);
		this.add(this.healthBarFrame);

		// Gathering progress bar (yellow, below health bar, starts hidden)
		this.gatherBarBg = scene.add.rectangle(0, -9, 32, 3, 0x000000);
		this.gatherBarBg.setVisible(false);
		this.add(this.gatherBarBg);

		this.gatherBar = scene.add.rectangle(-16, -9, 0, 3, 0xffd700);
		this.gatherBar.setOrigin(0, 0.5);
		this.gatherBar.setVisible(false);
		this.add(this.gatherBar);

		this.gatherBarFrame = scene.add.rectangle(0, -9, 32, 3);
		this.gatherBarFrame.setStrokeStyle(1, 0xffffff, 0.8);
		this.gatherBarFrame.setFillStyle(0x000000, 0);
		this.gatherBarFrame.setVisible(false);
		this.add(this.gatherBarFrame);

		this.updateHealthBar();

		// Store in game context
		gameContext.units.set(unitData.id, unitData);

		scene.add.existing(this);
		gameContext.sceneLayers.units.add(this);

		// Make interactive
		this.setSize(32, 32);
		this.setInteractive();
	}

	moveTo(position, duration = 500) {
		const pos = gridToPxPosition(position);

		this.gridPosition = position;

		this.scene.tweens.add({
			targets: this,
			x: pos.x,
			y: pos.y,
			duration,
			ease: 'Linear',
		});
	}

	updateHealthBar() {
		const healthPercent = this.unitData.health / this.unitData.maxHealth;
		this.healthBar.width = 32 * healthPercent;
	}

	updateGatherProgress() {
		// Show/hide gathering progress bar based on unit status
		const isGathering = this.unitData.status === 'gathering';
		const carryCapacity = UNITS[this.unitData.type].carryCapacity;
		const carrying = this.unitData.currentAction?.carrying || 0;
		const progress = carrying / carryCapacity;

		if (isGathering && carrying > 0) {
			this.gatherBarBg.setVisible(true);
			this.gatherBar.setVisible(true);
			this.gatherBarFrame.setVisible(true);
			this.gatherBar.width = 32 * progress;
		} else {
			this.gatherBarBg.setVisible(false);
			this.gatherBar.setVisible(false);
			this.gatherBarFrame.setVisible(false);
		}
	}

	setSelected(selected) {
		this.unitData.selected = selected;
		if (selected) this.sprite.setTint(0x00ff00);
		else this.sprite.clearTint();
	}

	destroy() {
		gameContext.units.delete(this.unitId);
		super.destroy();
	}
}
