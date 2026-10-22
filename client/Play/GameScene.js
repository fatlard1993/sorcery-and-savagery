import Phaser from 'phaser';
import gameContext from '../shared/gameContext.js';
import { WORLD_CONFIG } from '../../constants/index.js';
import { gridToPxPosition } from '../../utils/index.js';
import { onPointerDown, onPointerMove, onPointerUp } from './inputs/pointer.js';
import { onKeyDown } from './inputs/keyboard.js';
import Terrain from './GameObjects/Terrain.js';
import Resource from './GameObjects/Resource.js';
import Building from './GameObjects/Building.js';
import Unit from './GameObjects/Unit.js';

export default class GameScene extends Phaser.Scene {
	constructor() {
		super({ key: 'GameScene' });
	}

	preload() {
		console.log('Preloading assets...');

		// Load terrain spritesheet (8 tiles: 2 dirt, 2 grass, 2 water, 2 stone)
		this.load.spritesheet('ground', '/assets/terrain/ground.png', {
			frameWidth: 32,
			frameHeight: 32,
		});

		// Load resource spritesheets (3 variants each)
		this.load.spritesheet('forest', '/assets/resources/forest.png', {
			frameWidth: 48,
			frameHeight: 48,
		});
		this.load.spritesheet('stone_deposit', '/assets/resources/stone_deposit.png', {
			frameWidth: 48,
			frameHeight: 48,
		});
		this.load.spritesheet('water_source', '/assets/resources/water_source.png', {
			frameWidth: 48,
			frameHeight: 48,
		});

		// Load building images
		this.load.image('campfire', '/assets/buildings/campfire.png');
		this.load.image('town_center', '/assets/buildings/town_center.png');
		this.load.spritesheet('house', '/assets/buildings/house.png', {
			frameWidth: 64,
			frameHeight: 64,
		});
		this.load.image('barracks', '/assets/buildings/barracks.png');
		this.load.image('archery_range', '/assets/buildings/archery_range.png');
		this.load.image('mine', '/assets/buildings/mine.png');
		this.load.image('farm', '/assets/buildings/farm.png');
		this.load.image('forge', '/assets/buildings/forge.png');
		this.load.image('mage_tower', '/assets/buildings/mage_tower.png');
		this.load.image('well', '/assets/buildings/well.png');

		// Load unit images
		this.load.image('worker', '/assets/units/worker.png');
		this.load.image('warrior', '/assets/units/warrior.png');
		this.load.image('archer', '/assets/units/archer.png');
		this.load.image('mage', '/assets/units/mage.png');
		this.load.image('healer', '/assets/units/healer.png');
	}

	create() {
		console.log('Creating game scene...');
		console.log('Server state:', gameContext.serverState);
		console.log('Players:', gameContext.serverState?.players);
		console.log('Units:', gameContext.serverState?.units);
		console.log('Buildings:', gameContext.serverState?.buildings);

		gameContext.scene = this;

		// Check if we have server state
		if (!gameContext.serverState) {
			console.error('No server state available!');
			return;
		}

		// Initialize layers for proper Z-ordering
		gameContext.sceneLayers = {
			terrain: this.add.layer(),
			resources: this.add.layer(),
			buildings: this.add.layer(),
			units: this.add.layer(),
			ui: this.add.layer(),
		};

		// Load initial game state from server
		const state = gameContext.serverState;

		// Guard against missing state (e.g., if navigating to dead game)
		if (!state || !state.players || !state.world) {
			console.error('GameScene: Invalid game state, cannot create scene');
			return;
		}

		console.log('Creating terrain:', state.world?.terrain?.length, 'tiles');

		// Populate gameContext with server data
		state.players.forEach(player => {
			gameContext.players.set(player.id, player);
		});

		// Create terrain
		state.world.terrain.forEach(tile => {
			new Terrain(this, tile.x, tile.y, tile.type);
		});

		console.log('Creating resources:', state.world.resources?.length);
		// Create resource nodes (from world.resources, not separate resources array)
		state.world.resources.forEach(resource => {
			new Resource(this, resource);
		});

		console.log('Creating buildings:', state.buildings?.length);
		// Create buildings
		state.buildings.forEach(building => {
			new Building(this, building);
		});

		console.log('Creating units:', state.units?.length);
		// Create units
		state.units.forEach(unit => {
			new Unit(this, unit);
		});

		// Setup camera
		const worldWidth = WORLD_CONFIG.width * WORLD_CONFIG.tileSize;
		const worldHeight = WORLD_CONFIG.height * WORLD_CONFIG.tileSize;
		this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

		// Center camera on current player's town center
		const currentPlayer = gameContext.players.currentPlayer;
		if (currentPlayer) {
			const townCenter = [...gameContext.buildings.values()].find(
				b => b.playerId === gameContext.playerId && b.type === 'town_center',
			);
			if (townCenter) {
				const pos = gridToPxPosition(townCenter.position);
				this.cameras.main.centerOn(pos.x, pos.y);
				console.log('Centered camera on town center at', pos);
			}
		}

		// Setup input handlers
		this.input.on('pointerdown', onPointerDown);
		this.input.on('pointermove', onPointerMove);
		this.input.on('pointerup', onPointerUp);
		this.input.keyboard.on('keydown', onKeyDown);

		// Mouse wheel camera pan
		this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
			const camera = this.cameras.main;
			const panSpeed = 2;

			// Native horizontal scroll (trackpad/mouse side scroll)
			if (deltaX !== 0) {
				camera.scrollX += deltaX * panSpeed;
			}

			// Shift+wheel for horizontal scroll, regular wheel for vertical
			if (pointer.event.shiftKey) {
				camera.scrollX += deltaY * panSpeed;
			} else {
				camera.scrollY += deltaY * panSpeed;
			}
		});

		// Create selection rectangle (initially hidden)
		gameContext.selectionRect = this.add.rectangle(0, 0, 0, 0, 0x00ff00, 0.2);
		gameContext.selectionRect.setStrokeStyle(2, 0x00ff00);
		gameContext.selectionRect.setOrigin(0, 0);
		gameContext.selectionRect.setVisible(false);
		gameContext.sceneLayers.ui.add(gameContext.selectionRect);

		console.log('Game scene created successfully');
		console.log('Camera position:', this.cameras.main.scrollX, this.cameras.main.scrollY);
		console.log('Total game objects:', this.children.list.length);
	}

	update() {
		// Camera panning with arrow keys or WASD
		const camera = this.cameras.main;
		const panSpeed = 10;

		if (this.input.keyboard.addKey('W').isDown || this.input.keyboard.addKey('UP').isDown) {
			camera.scrollY -= panSpeed;
		}
		if (this.input.keyboard.addKey('S').isDown || this.input.keyboard.addKey('DOWN').isDown) {
			camera.scrollY += panSpeed;
		}
		if (this.input.keyboard.addKey('A').isDown || this.input.keyboard.addKey('LEFT').isDown) {
			camera.scrollX -= panSpeed;
		}
		if (this.input.keyboard.addKey('D').isDown || this.input.keyboard.addKey('RIGHT').isDown) {
			camera.scrollX += panSpeed;
		}
	}
}
