import { WORLD_CONFIG, TERRAIN_TYPES, RESOURCE_TYPES } from '../constants/index.js';
import { simpleId } from '../utils/index.js';

export function generateWorld() {
	const terrain = [];
	const resources = [];

	// Generate terrain (simple: mostly grass with some variation)
	for (let x = 0; x < WORLD_CONFIG.width; x++) {
		for (let y = 0; y < WORLD_CONFIG.height; y++) {
			let type = 'grass';

			// Add some variety
			const rand = Math.random();
			if (rand < 0.1) {
				type = 'dirt';
			} else if (rand < 0.15) {
				type = 'water';
			} else if (rand < 0.18) {
				type = 'mountain';
			}

			terrain.push({ x, y, type });
		}
	}

	// Generate resource nodes
	// Forests (food OR wood when chopped)
	for (let i = 0; i < 40; i++) {
		const x = Math.floor(Math.random() * WORLD_CONFIG.width);
		const y = Math.floor(Math.random() * WORLD_CONFIG.height);

		const terrainTile = terrain.find(t => t.x === x && t.y === y);
		if (terrainTile && terrainTile.type === 'grass') {
			resources.push({
				id: simpleId(),
				type: 'forest',
				resourceType: 'food', // Default to food gathering
				position: { x, y },
				amount: RESOURCE_TYPES.forest.amount,
				maxAmount: RESOURCE_TYPES.forest.maxAmount,
				gatherRate: RESOURCE_TYPES.forest.gatherRate,
				chopped: false, // Can be chopped to switch to wood
			});
		}
	}

	// Stone deposits
	for (let i = 0; i < 20; i++) {
		const x = Math.floor(Math.random() * WORLD_CONFIG.width);
		const y = Math.floor(Math.random() * WORLD_CONFIG.height);

		const terrainTile = terrain.find(t => t.x === x && t.y === y);
		if (terrainTile && (terrainTile.type === 'grass' || terrainTile.type === 'mountain')) {
			resources.push({
				id: simpleId(),
				type: 'stone_deposit',
				resourceType: 'stone',
				position: { x, y },
				amount: RESOURCE_TYPES.stone_deposit.amount,
				maxAmount: RESOURCE_TYPES.stone_deposit.maxAmount,
				gatherRate: RESOURCE_TYPES.stone_deposit.gatherRate,
			});
		}
	}

	// Water sources (near water terrain)
	for (let i = 0; i < 10; i++) {
		const x = Math.floor(Math.random() * WORLD_CONFIG.width);
		const y = Math.floor(Math.random() * WORLD_CONFIG.height);

		const terrainTile = terrain.find(t => t.x === x && t.y === y);
		// Place water sources near water tiles or randomly on grass
		if (terrainTile && (terrainTile.type === 'grass' || terrainTile.type === 'water')) {
			resources.push({
				id: simpleId(),
				type: 'water_source',
				resourceType: 'water',
				position: { x, y },
				amount: Infinity,
				maxAmount: Infinity,
				gatherRate: RESOURCE_TYPES.water_source.gatherRate,
			});
		}
	}

	return {
		width: WORLD_CONFIG.width,
		height: WORLD_CONFIG.height,
		terrain,
		resources,
	};
}
