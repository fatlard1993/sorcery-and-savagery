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
		// this.sprite.setTint(this.playerColor);

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
		console.log('Unit.moveTo called with position:', position, 'duration:', duration);
		const pos = gridToPxPosition(position);
		console.log('Converted to pixel position:', pos);
		console.log('Current unit position:', this.x, this.y);

		this.gridPosition = position;

		const tween = this.scene.tweens.add({
			targets: this,
			x: pos.x,
			y: pos.y,
			duration,
			ease: 'Linear',
		});

		console.log('Tween created:', tween);
	}

	updateHealthBar() {
		const stats = UNITS[this.unitData.type];
		const healthPercent = this.unitData.health / this.unitData.maxHealth;
		this.healthBar.width = 32 * healthPercent;

		// Color based on health
		// if (healthPercent > 0.6) {
		// 	this.healthBar.setFillStyle(0x00FF00);
		// } else if (healthPercent > 0.3) {
		// 	this.healthBar.setFillStyle(0xFFFF00);
		// } else {
		// 	this.healthBar.setFillStyle(0xFF0000);
		// }
	}

	setSelected(selected) {
		this.unitData.selected = selected;
		if (selected) this.sprite.setTint(0x00FF00);
		else this.sprite.clearTint();
	}

	destroy() {
		gameContext.units.delete(this.unitId);
		super.destroy();
	}
}
