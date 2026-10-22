/**
 * Terrain pattern generation functions
 * Each function takes a terrain grid and modifies it in place
 */

import { randomInRange } from '../constants/levelConfigs.js';

/**
 * Get a terrain tile at x, y coordinates
 * @param terrain
 * @param width
 * @param x
 * @param y
 */
function getTile(terrain, width, x, y) {
	return terrain[y * width + x];
}

/**
 * Set terrain type at x, y coordinates
 * @param terrain
 * @param width
 * @param height
 * @param x
 * @param y
 * @param type
 */
function setTile(terrain, width, height, x, y, type) {
	// Check bounds first
	if (x < 0 || x >= width || y < 0 || y >= height) {
		return;
	}

	const index = y * width + x;
	if (index >= 0 && index < terrain.length && terrain[index]) {
		terrain[index].type = type;
	}
}

/**
 * Check if coordinates are within bounds
 * @param x
 * @param y
 * @param width
 * @param height
 */
function inBounds(x, y, width, height) {
	return x >= 0 && x < width && y >= 0 && y < height;
}

/**
 * Generate a flowing river pattern (winding path)
 * @param terrain
 * @param width
 * @param height
 * @param config
 */
export function generateRiver(terrain, width, height, config) {
	const riverWidth = randomInRange(config.width);
	const riverLength = randomInRange(config.length);

	// Start from a random edge
	const startSide = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
	let x, y, direction;

	switch (startSide) {
		case 0: // top
			x = Math.floor(Math.random() * width);
			y = 0;
			direction = Math.PI / 2; // pointing down
			break;
		case 1: // right
			x = width - 1;
			y = Math.floor(Math.random() * height);
			direction = Math.PI; // pointing left
			break;
		case 2: // bottom
			x = Math.floor(Math.random() * width);
			y = height - 1;
			direction = -Math.PI / 2; // pointing up
			break;
		case 3: // left
			x = 0;
			y = Math.floor(Math.random() * height);
			direction = 0; // pointing right
			break;
	}

	// Generate winding path
	for (let i = 0; i < riverLength; i++) {
		// Draw river width
		for (let w = -Math.floor(riverWidth / 2); w <= Math.floor(riverWidth / 2); w++) {
			const offsetX = Math.floor(x + w * Math.cos(direction + Math.PI / 2));
			const offsetY = Math.floor(y + w * Math.sin(direction + Math.PI / 2));

			setTile(terrain, width, height, offsetX, offsetY, config.terrain);
		}

		// Move forward with some meandering
		direction += (Math.random() - 0.5) * 0.5; // slight direction change
		x += Math.cos(direction);
		y += Math.sin(direction);

		// Stop if out of bounds
		if (!inBounds(Math.floor(x), Math.floor(y), width, height)) {
			break;
		}
	}
}

/**
 * Generate an organic shape (lakes)
 * @param terrain
 * @param width
 * @param height
 * @param config
 */
export function generateOrganicShape(terrain, width, height, config) {
	const centerX = Math.floor(Math.random() * width);
	const centerY = Math.floor(Math.random() * height);
	const radius = randomInRange(config.size);

	// Use multiple circles with varying radii for organic shape
	const numCircles = 5 + Math.floor(Math.random() * 5);

	for (let i = 0; i < numCircles; i++) {
		const offsetX = centerX + Math.floor((Math.random() - 0.5) * radius);
		const offsetY = centerY + Math.floor((Math.random() - 0.5) * radius);
		const subRadius = radius * (0.5 + Math.random() * 0.5);

		// Fill circle
		for (let dx = -subRadius; dx <= subRadius; dx++) {
			for (let dy = -subRadius; dy <= subRadius; dy++) {
				if (dx * dx + dy * dy <= subRadius * subRadius) {
					const x = offsetX + dx;
					const y = offsetY + dy;

					setTile(terrain, width, height, x, y, config.terrain);
				}
			}
		}
	}
}

/**
 * Generate a clustered pattern (mountains, forests)
 * @param terrain
 * @param width
 * @param height
 * @param config
 */
export function generateClusteredShape(terrain, width, height, config) {
	const centerX = Math.floor(Math.random() * width);
	const centerY = Math.floor(Math.random() * height);
	const size = randomInRange(config.size);

	// Create cluster using random walk
	let x = centerX;
	let y = centerY;

	for (let i = 0; i < size * size; i++) {
		// Set current tile
		setTile(terrain, width, height, x, y, config.terrain);

		// Random walk to adjacent tile
		const direction = Math.floor(Math.random() * 4);
		switch (direction) {
			case 0:
				y--;
				break; // up
			case 1:
				x++;
				break; // right
			case 2:
				y++;
				break; // down
			case 3:
				x--;
				break; // left
		}

		// Bias back toward center to keep cluster tight
		if (Math.abs(x - centerX) > size / 2) {
			x += x > centerX ? -1 : 1;
		}
		if (Math.abs(y - centerY) > size / 2) {
			y += y > centerY ? -1 : 1;
		}

		// Keep in bounds
		x = Math.max(0, Math.min(width - 1, x));
		y = Math.max(0, Math.min(height - 1, y));
	}
}

/**
 * Generate terrain near water (feathering edges)
 * @param terrain
 * @param width
 * @param height
 * @param config
 */
export function generateNearWaterShape(terrain, width, height, config) {
	const size = randomInRange(config.size);

	// Find a random water tile
	const waterTiles = [];
	for (let x = 0; x < width; x++) {
		for (let y = 0; y < height; y++) {
			const tile = getTile(terrain, width, x, y);
			if (tile && tile.type === 'water') {
				waterTiles.push({ x, y });
			}
		}
	}

	// If no water tiles found, skip
	if (waterTiles.length === 0) {
		return;
	}

	// Pick a random water tile
	const waterTile = waterTiles[Math.floor(Math.random() * waterTiles.length)];

	// Place tiles adjacent to this water tile
	for (let i = 0; i < size; i++) {
		// Check all adjacent positions
		const directions = [
			{ dx: -1, dy: 0 },
			{ dx: 1, dy: 0 },
			{ dx: 0, dy: -1 },
			{ dx: 0, dy: 1 },
			{ dx: -1, dy: -1 },
			{ dx: 1, dy: -1 },
			{ dx: -1, dy: 1 },
			{ dx: 1, dy: 1 },
		];

		const dir = directions[Math.floor(Math.random() * directions.length)];
		const x = waterTile.x + dir.dx;
		const y = waterTile.y + dir.dy;

		// Only place if not water
		if (inBounds(x, y, width, height)) {
			const tile = getTile(terrain, width, x, y);
			if (tile && tile.type !== 'water') {
				setTile(terrain, width, height, x, y, config.terrain);
			}
		}
	}
}

/**
 * Pattern dispatcher - calls appropriate pattern function
 * @param terrain
 * @param width
 * @param height
 * @param pattern
 * @param config
 */
export function generatePattern(terrain, width, height, pattern, config) {
	switch (pattern) {
		case 'flow':
			generateRiver(terrain, width, height, config);
			break;
		case 'organic':
			generateOrganicShape(terrain, width, height, config);
			break;
		case 'clustered':
			generateClusteredShape(terrain, width, height, config);
			break;
		case 'near_water':
			generateNearWaterShape(terrain, width, height, config);
			break;
		default:
			console.warn(`Unknown pattern: ${pattern}`);
	}
}
