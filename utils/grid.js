import { WORLD_CONFIG } from '../constants/index.js';

/**
 *
 * @param root0
 * @param root0.x
 * @param root0.y
 */
export function gridToPxPosition({ x, y }) {
	return {
		x: x * WORLD_CONFIG.tileSize + WORLD_CONFIG.tileSize / 2,
		y: y * WORLD_CONFIG.tileSize + WORLD_CONFIG.tileSize / 2,
	};
}

/**
 *
 * @param root0
 * @param root0.x
 * @param root0.y
 */
export function pxToGridPosition({ x, y }) {
	return {
		x: Math.floor(x / WORLD_CONFIG.tileSize),
		y: Math.floor(y / WORLD_CONFIG.tileSize),
	};
}

/**
 *
 * @param root0
 * @param root0.x
 * @param root0.y
 */
export function isValidGridPosition({ x, y }) {
	return x >= 0 && x < WORLD_CONFIG.width && y >= 0 && y < WORLD_CONFIG.height;
}

/**
 *
 * @param pos1
 * @param pos2
 */
export function gridDistance(pos1, pos2) {
	return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
}

/**
 *
 * @param root0
 * @param root0.x
 * @param root0.y
 */
export function getNeighbors({ x, y }) {
	return [
		{ x: x + 1, y },
		{ x: x - 1, y },
		{ x, y: y + 1 },
		{ x, y: y - 1 },
	].filter(isValidGridPosition);
}

/**
 *
 * @param topLeft
 * @param size
 */
export function getCellsInRect(topLeft, size) {
	const cells = [];
	for (let x = 0; x < size.width; x++) {
		for (let y = 0; y < size.height; y++) {
			const pos = { x: topLeft.x + x, y: topLeft.y + y };
			if (isValidGridPosition(pos)) {
				cells.push(pos);
			}
		}
	}
	return cells;
}
