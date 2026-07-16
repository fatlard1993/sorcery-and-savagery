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
 * @param pos1
 * @param pos2
 */
export function euclideanDistance(pos1, pos2) {
	const dx = pos2.x - pos1.x;
	const dy = pos2.y - pos1.y;
	return Math.sqrt(dx * dx + dy * dy);
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
 * @param center
 * @param radius
 */
export function getCellsInRadius(center, radius) {
	const cells = [];
	for (let dx = -radius; dx <= radius; dx++) {
		for (let dy = -radius; dy <= radius; dy++) {
			const pos = { x: center.x + dx, y: center.y + dy };
			if (isValidGridPosition(pos) && gridDistance(center, pos) <= radius) {
				cells.push(pos);
			}
		}
	}
	return cells;
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

/**
 *
 * @param vec
 */
export function normalize(vec) {
	const length = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
	if (length === 0) return { x: 0, y: 0 };
	return { x: vec.x / length, y: vec.y / length };
}

/**
 *
 * @param vec1
 * @param vec2
 */
export function subtract(vec1, vec2) {
	return { x: vec1.x - vec2.x, y: vec1.y - vec2.y };
}

/**
 *
 * @param vec1
 * @param vec2
 */
export function add(vec1, vec2) {
	return { x: vec1.x + vec2.x, y: vec1.y + vec2.y };
}

/**
 *
 * @param vec
 * @param scalar
 */
export function multiply(vec, scalar) {
	return { x: vec.x * scalar, y: vec.y * scalar };
}
