export { STARTING_GROUPS } from './startingGroups.js';
export { UNITS } from './units.js';
export { BUILDINGS } from './buildings.js';
export { RESOURCE_TYPES, RESOURCE_COLORS } from './resources.js';

export const WORLD_CONFIG = {
	width: 64,
	height: 64,
	tileSize: 32, // pixels
};

export const TERRAIN_TYPES = {
	grass: {
		id: 'grass',
		name: 'Grass',
		sprite: 'grass',
		walkable: true,
		buildable: true,
	},
	dirt: {
		id: 'dirt',
		name: 'Dirt',
		sprite: 'dirt',
		walkable: true,
		buildable: true,
	},
	water: {
		id: 'water',
		name: 'Water',
		sprite: 'water',
		walkable: false,
		buildable: false,
	},
	mountain: {
		id: 'mountain',
		name: 'Mountain',
		sprite: 'mountain',
		walkable: true,
		buildable: true,
	},
};

export const PLAYER_COLORS = [
	0xFF0000, // Red
	0x0000FF, // Blue
	0x00FF00, // Green
	0xFFFF00, // Yellow
];
