export const RESOURCE_TYPES = {
	forest: {
		id: 'forest',
		name: 'Forest',
		resourceType: 'food', // Standing forests provide food (berries, game)
		alternateResourceType: 'wood', // Or can be cut down for wood
		sprite: 'forest',
		size: { width: 3, height: 3 }, // Occupies 3x3 grid
		amount: 500,
		maxAmount: 500,
		gatherRate: 3, // Food gathering rate
		chopRate: 5, // Wood gathering rate when chopped
	},
	stone_deposit: {
		id: 'stone_deposit',
		name: 'Stone Deposit',
		resourceType: 'stone',
		sprite: 'stone_deposit',
		size: { width: 2, height: 2 }, // Occupies 2x2 grid
		amount: 800,
		maxAmount: 800,
		gatherRate: 4,
	},
	water_source: {
		id: 'water_source',
		name: 'Water Source',
		resourceType: 'water',
		sprite: 'water_source',
		size: { width: 2, height: 2 }, // Occupies 2x2 grid
		amount: Infinity, // Water doesn't deplete
		maxAmount: Infinity,
		gatherRate: 5,
	},
};

export const RESOURCE_COLORS = {
	wood: 0x8b4513,
	stone: 0x808080,
	iron: 0xc0c0c0,
	water: 0x4169e1,
	food: 0x90ee90,
};
