import { getNeighbors, gridDistance, isValidGridPosition } from './grid.js';

// Simple A* pathfinding
/**
 *
 * @param start
 * @param goal
 * @param isWalkable
 */
export function findPath(start, goal, isWalkable = () => true) {
	if (!isValidGridPosition(start) || !isValidGridPosition(goal)) {
		return [];
	}

	if (start.x === goal.x && start.y === goal.y) {
		return [start];
	}

	const openSet = new Set([posKey(start)]);
	const cameFrom = new Map();

	const gScore = new Map();
	gScore.set(posKey(start), 0);

	const fScore = new Map();
	fScore.set(posKey(start), gridDistance(start, goal));

	while (openSet.size > 0) {
		// Find node in openSet with lowest fScore
		let current = null;
		let lowestF = Infinity;

		for (const key of openSet) {
			const f = fScore.get(key) ?? Infinity;
			if (f < lowestF) {
				lowestF = f;
				current = keyToPos(key);
			}
		}

		if (!current) break;

		// Check if reached goal
		if (current.x === goal.x && current.y === goal.y) {
			return reconstructPath(cameFrom, current);
		}

		openSet.delete(posKey(current));

		// Check all neighbors
		const neighbors = getNeighbors(current);
		for (const neighbor of neighbors) {
			if (!isWalkable(neighbor)) continue;

			const tentativeGScore = (gScore.get(posKey(current)) ?? Infinity) + 1;
			const neighborKey = posKey(neighbor);

			if (tentativeGScore < (gScore.get(neighborKey) ?? Infinity)) {
				cameFrom.set(neighborKey, current);
				gScore.set(neighborKey, tentativeGScore);
				fScore.set(neighborKey, tentativeGScore + gridDistance(neighbor, goal));

				if (!openSet.has(neighborKey)) {
					openSet.add(neighborKey);
				}
			}
		}
	}

	// No path found
	return [];
}

/**
 *
 * @param cameFrom
 * @param current
 */
function reconstructPath(cameFrom, current) {
	const path = [current];
	let currentKey = posKey(current);

	while (cameFrom.has(currentKey)) {
		current = cameFrom.get(currentKey);
		path.unshift(current);
		currentKey = posKey(current);
	}

	// Remove the starting position from the path
	// The unit is already at the start, so we only need the moves
	if (path.length > 1) {
		path.shift();
	}

	return path;
}

/**
 *
 * @param pos
 */
function posKey(pos) {
	return `${pos.x},${pos.y}`;
}

/**
 *
 * @param key
 */
function keyToPos(key) {
	const [x, y] = key.split(',').map(Number);
	return { x, y };
}
