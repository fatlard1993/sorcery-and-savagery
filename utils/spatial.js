// Spatial grid for efficient proximity queries
export class SpatialGrid {
	constructor(cellSize = 8) {
		this.cellSize = cellSize;
		this.cells = new Map();
	}

	getCellKey(x, y) {
		return `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`;
	}

	add(obj) {
		const key = this.getCellKey(obj.position.x, obj.position.y);
		if (!this.cells.has(key)) {
			this.cells.set(key, new Set());
		}
		this.cells.get(key).add(obj);
		obj._spatialCellKey = key;
	}

	remove(obj) {
		if (obj._spatialCellKey) {
			const cell = this.cells.get(obj._spatialCellKey);
			if (cell) {
				cell.delete(obj);
				if (cell.size === 0) {
					this.cells.delete(obj._spatialCellKey);
				}
			}
			delete obj._spatialCellKey;
		}
	}

	update(obj) {
		const newKey = this.getCellKey(obj.position.x, obj.position.y);
		if (obj._spatialCellKey !== newKey) {
			this.remove(obj);
			this.add(obj);
		}
	}

	getNearby(position, range) {
		const nearby = [];
		const cellRange = Math.ceil(range / this.cellSize);
		const centerCellX = Math.floor(position.x / this.cellSize);
		const centerCellY = Math.floor(position.y / this.cellSize);

		for (let dx = -cellRange; dx <= cellRange; dx++) {
			for (let dy = -cellRange; dy <= cellRange; dy++) {
				const key = `${centerCellX + dx},${centerCellY + dy}`;
				const cell = this.cells.get(key);
				if (cell) {
					nearby.push(...cell);
				}
			}
		}

		return nearby;
	}

	clear() {
		this.cells.clear();
	}
}
