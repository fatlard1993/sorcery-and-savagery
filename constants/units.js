export const UNITS = {
	worker: {
		id: 'worker',
		name: 'Worker',
		description: 'Gathers resources and constructs buildings',
		sprite: 'worker',
		cost: {
			wood: 0,
			stone: 0,
			iron: 0,
			food: 50,
		},
		productionTime: 15, // seconds
		health: 40,
		maxHealth: 40,
		moveSpeed: 2.5, // tiles per second
		attackDamage: 2,
		attackSpeed: 2.0, // attacks per second
		attackRange: 1, // tiles
		visionRange: 4, // tiles
		carryCapacity: 20, // 2x other units
		gatherRate: 10, // 2x faster than other units
		buildSpeed: 2.0, // 2x faster than other units
		populationCost: 1,
	},
	warrior: {
		id: 'warrior',
		name: 'Warrior',
		description: 'Basic melee combat unit',
		sprite: 'warrior',
		cost: {
			wood: 0,
			stone: 0,
			iron: 25,
			food: 60,
		},
		productionTime: 20, // seconds
		health: 100,
		maxHealth: 100,
		moveSpeed: 2.0, // tiles per second
		attackDamage: 12,
		attackSpeed: 1.0, // attacks per second
		attackRange: 1, // tiles (melee)
		visionRange: 5, // tiles
		carryCapacity: 10, // Half of worker
		gatherRate: 5, // Half of worker
		buildSpeed: 1.0, // Half of worker
		populationCost: 1,
	},
	archer: {
		id: 'archer',
		name: 'Archer',
		description: 'Ranged combat unit',
		sprite: 'archer',
		cost: {
			wood: 25,
			stone: 0,
			iron: 30,
			food: 40,
		},
		productionTime: 25, // seconds
		health: 60,
		maxHealth: 60,
		moveSpeed: 2.2, // tiles per second
		attackDamage: 10,
		attackSpeed: 0.8, // attacks per second
		attackRange: 5, // tiles (ranged)
		visionRange: 7, // tiles
		carryCapacity: 10,
		gatherRate: 5,
		buildSpeed: 1.0,
		populationCost: 1,
	},
	mage: {
		id: 'mage',
		name: 'Mage',
		description: 'Powerful ranged spellcaster with area damage',
		sprite: 'mage',
		cost: {
			wood: 0,
			stone: 0,
			iron: 50,
			food: 80,
			water: 30,
		},
		productionTime: 35, // seconds (expensive)
		health: 50,
		maxHealth: 50,
		moveSpeed: 1.8, // tiles per second (slow)
		attackDamage: 20,
		attackSpeed: 0.5, // attacks per second (slow but powerful)
		attackRange: 6, // tiles (long range)
		visionRange: 6, // tiles
		carryCapacity: 10,
		gatherRate: 5,
		buildSpeed: 1.0,
		populationCost: 2, // Takes up 2 population
		splashDamage: true, // Deals damage in area
		splashRadius: 1,
	},
	healer: {
		id: 'healer',
		name: 'Healer',
		description: 'Dedicated healer with powerful restoration magic',
		sprite: 'healer',
		cost: {
			wood: 20,
			stone: 0,
			iron: 30,
			food: 70,
			water: 50,
		},
		productionTime: 32, // seconds
		health: 55,
		maxHealth: 55,
		moveSpeed: 2.1, // tiles per second
		attackDamage: 0, // Cannot attack
		attackSpeed: 0,
		attackRange: 0,
		carryCapacity: 10,
		gatherRate: 5,
		buildSpeed: 1.0,
		visionRange: 5,
		populationCost: 2,
		healingRate: 20, // HP per second (powerful)
		healingRange: 4, // tiles
	},
};
