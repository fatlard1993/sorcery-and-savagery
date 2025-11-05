/**
 * Level configurations for pattern-based terrain generation
 * Inspired by void-driller's pattern system
 */

export const DEFAULT_LEVEL = {
	// Base terrain type for the entire map
	base: 'grass',

	// Terrain features with patterns
	features: {
		// Rivers - winding water paths
		rivers: {
			count: [2, 4], // min, max
			width: [2, 4],
			length: [20, 40],
			pattern: 'flow', // winding, meandering path
			terrain: 'water',
		},

		// Lakes - larger water bodies
		lakes: {
			count: [1, 3],
			size: [5, 10], // radius
			pattern: 'organic', // irregular, natural shape
			terrain: 'water',
		},

		// Mountain ranges - impassable terrain
		mountains: {
			count: [2, 4],
			size: [8, 15],
			pattern: 'clustered', // grouped together
			terrain: 'mountain',
		},

		// Dirt patches - clustered groups
		dirtPatches: {
			count: [8, 15],
			size: [5, 10],
			pattern: 'clustered', // grouped together like stone
			terrain: 'dirt',
		},

		// Dirt edges - feathers along water
		dirtEdges: {
			count: [10, 20],
			size: [2, 4],
			pattern: 'near_water', // feather water edges
			terrain: 'dirt',
		},
	},

	// Resource placement (happens after terrain)
	resources: {
		forests: {
			count: [150, 250], // Extremely dense forests
			clusterSize: [15, 25], // Very large clusters
			clusters: [20, 30], // Many more clusters
			pattern: 'clustered',
			terrain: ['grass', 'dirt'], // only on grass and dirt
		},

		stoneDeposits: {
			count: [100, 150], // Extremely dense stone
			clusterSize: [12, 20], // Very large clusters
			clusters: [15, 25], // Many more clusters
			pattern: 'near_mountain', // prefer near mountains
			terrain: ['grass', 'mountain'],
		},

		waterSources: {
			count: [8, 12],
			pattern: 'away_from_water', // natural springs away from water bodies
			terrain: ['grass', 'dirt'],
		},
	},
};

/**
 * Pattern generation helper - returns a random value within range
 * @param range
 */
export function randomInRange(range) {
	const [min, max] = range;
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
