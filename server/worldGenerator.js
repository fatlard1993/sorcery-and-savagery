import { simpleId } from '@fatlard1993/web-game-framework/utils';
import { randInt } from '@vanilla-bean/components/utils';
import { WORLD_CONFIG, RESOURCE_TYPES } from '../constants/index.js';
import { DEFAULT_LEVEL } from '../constants/levelConfigs.js';
import { generatePattern } from './terrainPatterns.js';

/**
 *
 * @param levelConfig
 */
export function generateWorld(levelConfig = DEFAULT_LEVEL) {
	const terrain = [];
	const resources = [];

	// Initialize terrain with base type
	for (let x = 0; x < WORLD_CONFIG.width; x++) {
		for (let y = 0; y < WORLD_CONFIG.height; y++) {
			terrain.push({ x, y, type: levelConfig.base });
		}
	}

	// Generate terrain features using patterns
	for (const featureConfig of Object.values(levelConfig.features)) {
		const count = randInt(...featureConfig.count);

		for (let i = 0; i < count; i++) {
			generatePattern(terrain, WORLD_CONFIG.width, WORLD_CONFIG.height, featureConfig.pattern, featureConfig);
		}
	}

	// Helper function to get terrain at position
	const getTerrainAt = (x, y) => terrain.find(t => t.x === x && t.y === y);

	// Helper function to check if position has nearby terrain type
	const hasNearbyTerrain = (x, y, terrainType, maxDistance = 3) => {
		for (let dx = -maxDistance; dx <= maxDistance; dx++) {
			for (let dy = -maxDistance; dy <= maxDistance; dy++) {
				const tile = getTerrainAt(x + dx, y + dy);
				if (tile && tile.type === terrainType) {
					return true;
				}
			}
		}
		return false;
	};

	// Helper function to check if an area is clear for resource placement
	const isAreaClear = (centerX, centerY, width, height) => {
		// Check if all tiles in the area are valid terrain and no other resources occupy them
		for (let dx = 0; dx < width; dx++) {
			for (let dy = 0; dy < height; dy++) {
				const x = centerX + dx;
				const y = centerY + dy;

				// Check bounds
				if (x < 0 || x >= WORLD_CONFIG.width || y < 0 || y >= WORLD_CONFIG.height) {
					return false;
				}

				// Check if any resource already occupies this tile
				if (
					resources.some(r => {
						const size = RESOURCE_TYPES[r.type].size;
						return (
							x >= r.position.x && x < r.position.x + size.width && y >= r.position.y && y < r.position.y + size.height
						);
					})
				) {
					return false;
				}
			}
		}
		return true;
	};

	// Generate resources based on level config
	if (levelConfig.resources.forests) {
		const forestConfig = levelConfig.resources.forests;
		const numClusters = randInt(...forestConfig.clusters);

		for (let cluster = 0; cluster < numClusters; cluster++) {
			// Pick random center for cluster (with 5-tile margin from edges)
			const margin = 5;
			const centerX = margin + Math.floor(Math.random() * (WORLD_CONFIG.width - margin * 2));
			const centerY = margin + Math.floor(Math.random() * (WORLD_CONFIG.height - margin * 2));

			// Place resources in cluster
			const clusterSize = randInt(...forestConfig.clusterSize);

			for (let i = 0; i < clusterSize; i++) {
				// Random position near cluster center
				const x = centerX + Math.floor((Math.random() - 0.5) * 10);
				const y = centerY + Math.floor((Math.random() - 0.5) * 10);

				const size = RESOURCE_TYPES.forest.size;

				// Check if 3x3 area is clear
				if (!isAreaClear(x, y, size.width, size.height)) {
					continue;
				}

				// Check if all tiles in the 3x3 area are valid terrain
				let allTilesValid = true;
				for (let dx = 0; dx < size.width; dx++) {
					for (let dy = 0; dy < size.height; dy++) {
						const tile = getTerrainAt(x + dx, y + dy);
						if (!tile || !forestConfig.terrain.includes(tile.type)) {
							allTilesValid = false;
							break;
						}
					}
					if (!allTilesValid) break;
				}

				if (allTilesValid) {
					resources.push({
						id: simpleId(),
						type: 'forest',
						resourceType: 'food',
						position: { x, y },
						size: RESOURCE_TYPES.forest.size,
						amount: RESOURCE_TYPES.forest.amount,
						maxAmount: RESOURCE_TYPES.forest.maxAmount,
						gatherRate: RESOURCE_TYPES.forest.gatherRate,
						chopped: false,
					});
				}
			}
		}
	}

	// Stone deposits
	if (levelConfig.resources.stoneDeposits) {
		const stoneConfig = levelConfig.resources.stoneDeposits;
		const numClusters = randInt(...stoneConfig.clusters);

		for (let cluster = 0; cluster < numClusters; cluster++) {
			let centerX = Math.floor(Math.random() * WORLD_CONFIG.width);
			let centerY = Math.floor(Math.random() * WORLD_CONFIG.height);

			// Prefer near mountains if pattern says so
			if (stoneConfig.pattern === 'near_mountain') {
				// Try to find a spot near mountains
				let attempts = 0;
				while (attempts < 20 && !hasNearbyTerrain(centerX, centerY, 'mountain', 5)) {
					centerX = Math.floor(Math.random() * WORLD_CONFIG.width);
					centerY = Math.floor(Math.random() * WORLD_CONFIG.height);
					attempts++;
				}
			}

			const clusterSize = randInt(...stoneConfig.clusterSize);

			for (let i = 0; i < clusterSize; i++) {
				const x = centerX + Math.floor((Math.random() - 0.5) * 8);
				const y = centerY + Math.floor((Math.random() - 0.5) * 8);

				const size = RESOURCE_TYPES.stone_deposit.size;

				// Check if 3x3 area is clear
				if (!isAreaClear(x, y, size.width, size.height)) {
					continue;
				}

				// Check if all tiles in the 3x3 area are valid terrain
				let allTilesValid = true;
				for (let dx = 0; dx < size.width; dx++) {
					for (let dy = 0; dy < size.height; dy++) {
						const tile = getTerrainAt(x + dx, y + dy);
						if (!tile || !stoneConfig.terrain.includes(tile.type)) {
							allTilesValid = false;
							break;
						}
					}
					if (!allTilesValid) break;
				}

				if (allTilesValid) {
					resources.push({
						id: simpleId(),
						type: 'stone_deposit',
						resourceType: 'stone',
						position: { x, y },
						size: RESOURCE_TYPES.stone_deposit.size,
						amount: RESOURCE_TYPES.stone_deposit.amount,
						maxAmount: RESOURCE_TYPES.stone_deposit.maxAmount,
						gatherRate: RESOURCE_TYPES.stone_deposit.gatherRate,
					});
				}
			}
		}
	}

	// Water sources
	if (levelConfig.resources.waterSources) {
		const waterConfig = levelConfig.resources.waterSources;
		const count = randInt(...waterConfig.count);

		for (let i = 0; i < count; i++) {
			let x = Math.floor(Math.random() * WORLD_CONFIG.width);
			let y = Math.floor(Math.random() * WORLD_CONFIG.height);

			// Place away from water bodies (natural springs)
			if (waterConfig.pattern === 'away_from_water') {
				let attempts = 0;
				while (attempts < 20 && hasNearbyTerrain(x, y, 'water', 3)) {
					x = Math.floor(Math.random() * WORLD_CONFIG.width);
					y = Math.floor(Math.random() * WORLD_CONFIG.height);
					attempts++;
				}
			}

			const size = RESOURCE_TYPES.water_source.size;

			// Check if 3x3 area is clear
			if (!isAreaClear(x, y, size.width, size.height)) {
				continue;
			}

			// Check if all tiles in the 3x3 area are valid terrain
			let allTilesValid = true;
			for (let dx = 0; dx < size.width; dx++) {
				for (let dy = 0; dy < size.height; dy++) {
					const tile = getTerrainAt(x + dx, y + dy);
					if (!tile || !waterConfig.terrain.includes(tile.type)) {
						allTilesValid = false;
						break;
					}
				}
				if (!allTilesValid) break;
			}

			if (allTilesValid) {
				resources.push({
					id: simpleId(),
					type: 'water_source',
					resourceType: 'water',
					position: { x, y },
					size: RESOURCE_TYPES.water_source.size,
					amount: Infinity,
					maxAmount: Infinity,
					gatherRate: RESOURCE_TYPES.water_source.gatherRate,
				});
			}
		}
	}

	return {
		width: WORLD_CONFIG.width,
		height: WORLD_CONFIG.height,
		terrain,
		resources,
	};
}
