import Phaser from 'phaser';
import gameContext from '../shared/gameContext.js';

export default class RadialMenu {
	constructor(scene, x, y, actions) {
		this.scene = scene;
		this.actions = actions; // Array of {label, icon, onSelect}
		this.buttons = [];
		this.graphics = null;
		this.radius = 80;
		this.buttonRadius = 30;

		// Keep original click position (don't clamp - buttons will rotate instead)
		this.x = x;
		this.y = y;

		this.create();
	}

	create() {
		const container = this.scene.add.container(this.x, this.y);
		container.setDepth(1000); // Always on top

		// Calculate positions in a circle
		const angleStep = (Math.PI * 2) / this.actions.length;

		// Adjust starting angle to keep buttons on screen
		const camera = this.scene.cameras.main;
		let startAngle = -Math.PI / 2; // Default: start at top

		// Check if any button would go off-screen and rotate if needed
		for (let offset = 0; offset < Math.PI * 2; offset += angleStep / 4) {
			let allButtonsOnScreen = true;
			for (let i = 0; i < this.actions.length; i++) {
				const angle = startAngle + offset + angleStep * i;
				const buttonX = this.x + Math.cos(angle) * this.radius;
				const buttonY = this.y + Math.sin(angle) * this.radius;

				if (buttonX - this.buttonRadius < 0 ||
					buttonX + this.buttonRadius > camera.width ||
					buttonY - this.buttonRadius < 0 ||
					buttonY + this.buttonRadius > camera.height) {
					allButtonsOnScreen = false;
					break;
				}
			}

			if (allButtonsOnScreen) {
				startAngle += offset;
				break;
			}
		}

		this.actions.forEach((action, index) => {
			const angle = angleStep * index + startAngle;
			const buttonX = Math.cos(angle) * this.radius;
			const buttonY = Math.sin(angle) * this.radius;

			// Button background circle
			const circle = this.scene.add.circle(buttonX, buttonY, this.buttonRadius, 0x444444, 0.9);
			circle.setStrokeStyle(3, 0xFFD700);
			circle.setInteractive({ useHandCursor: true });

			// Button label
			const text = this.scene.add.text(buttonX, buttonY, action.label, {
				fontSize: '14px',
				color: '#ffffff',
				align: 'center',
			});
			text.setOrigin(0.5, 0.5);

			// Hover effects
			circle.on('pointerover', () => {
				circle.setFillStyle(0x666666, 1);
				circle.setScale(1.1);
				text.setScale(1.1);
			});

			circle.on('pointerout', () => {
				circle.setFillStyle(0x444444, 0.9);
				circle.setScale(1);
				text.setScale(1);
			});

			// Click handler
			circle.on('pointerdown', () => {
				// Set flag to prevent scene's onPointerUp from processing this click
				gameContext.menuButtonClicked = true;
				setTimeout(() => {
					gameContext.menuButtonClicked = false;
				}, 100);

				action.onSelect();
				this.destroy();
			});

			container.add([circle, text]);
			this.buttons.push({ circle, text });
		});

		// Center indicator
		const centerCircle = this.scene.add.circle(0, 0, 10, 0xFFD700, 0.5);
		container.add(centerCircle);

		this.container = container;

		// Click outside to close
		this.scene.input.once('pointerdown', (pointer) => {
			const distance = Phaser.Math.Distance.Between(this.x, this.y, pointer.worldX, pointer.worldY);
			if (distance > this.radius + this.buttonRadius) {
				this.destroy();
			}
		});
	}

	destroy() {
		if (this.container) {
			this.container.destroy();
			this.container = null;
		}

		// Clear the active menu reference
		if (gameContext.activeRadialMenu === this) {
			gameContext.activeRadialMenu = null;
		}
	}
}
