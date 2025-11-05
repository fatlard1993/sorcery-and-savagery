import BaseGame from '../byod-web-game/server/Game.js';
import { STARTING_GROUPS, UNITS, BUILDINGS, RESOURCE_TYPES, WORLD_CONFIG, TERRAIN_TYPES } from '../constants/index.js';
import { simpleId, gridDistance, findPath, getCellsInRect } from '../utils/index.js';
import { SpatialGrid } from '../utils/spatial.js';
import { generateWorld } from './worldGenerator.js';

export default class Game extends BaseGame {
	constructor({ saveState = {}, ...options }) {
		super({ saveState, ...options });

		// Game collections
		this.units = new Map();
		this.buildings = new Map();
		this.resources = new Map();

		// Spatial indexing for efficient queries
		this.unitSpatialGrid = new SpatialGrid(8);
		this.buildingSpatialGrid = new SpatialGrid(8);

		// World data
		this.world = saveState.world || generateWorld();

		// Game loop
		this.tickRate = 60;
		this.tickInterval = 1000 / this.tickRate;
		this.lastTick = Date.now();
		this.tick = 0;

		// Restore from save state
		if (saveState.units) {
			saveState.units.forEach((unit) => {
				this.units.set(unit.id, unit);
				this.unitSpatialGrid.add(unit);
			});
		}

		if (saveState.buildings) {
			saveState.buildings.forEach((building) => {
				this.buildings.set(building.id, building);
				this.buildingSpatialGrid.add(building);
			});
		}

		if (saveState.resources) {
			saveState.resources.forEach((resource) => {
				this.resources.set(resource.id, resource);
			});
		}

		// Start game loop
		if (this.server) {
			console.log('[GAME] Starting game loop for game', this.id);
			this.startGameLoop();
		} else {
			console.warn('[GAME] No server, game loop NOT started!');
		}
	}

	startGameLoop() {
		console.log('[GAME] Game loop started, tick rate:', this.tickRate);
		this.gameLoop = setInterval(() => {
			const now = Date.now();
			const deltaTime = (now - this.lastTick) / 1000;
			this.gameTick(deltaTime);
			this.lastTick = now;
			this.tick++;
		}, this.tickInterval);
	}

	stopGameLoop() {
		if (this.gameLoop) {
			clearInterval(this.gameLoop);
			this.gameLoop = null;
		}
	}

	gameTick(deltaTime) {
		// Debug log every second
		if (this.tick % 60 === 0) {
			console.log(`[GAME] gameTick called, tick=${this.tick}, units=${this.units.size}`);
		}

		// Update all units
		for (const unit of this.units.values()) {
			this.updateUnit(unit, deltaTime);
		}

		// Update all buildings
		for (const building of this.buildings.values()) {
			this.updateBuilding(building, deltaTime);
		}

		// Check win conditions
		if (this.tick % 60 === 0) {
			// Check every second
			this.checkWinConditions();
		}
	}

	updateUnit(unit, deltaTime) {
		if (unit.health <= 0) return;

		switch (unit.status) {
			case 'moving':
				this.moveUnit(unit, deltaTime);
				break;
			case 'gathering':
				this.gatherResource(unit, deltaTime);
				break;
			case 'building':
				this.constructBuilding(unit, deltaTime);
				break;
			case 'attacking':
				this.attackTarget(unit, deltaTime);
				break;
			case 'idle':
				// Check for nearby enemies to auto-attack
				this.checkAutoAttack(unit);
				break;
		}
	}

	moveUnit(unit, deltaTime) {
		console.log(`[GAME] moveUnit called for ${unit.id}, path length: ${unit.path?.length || 0}`);

		if (!unit.path || unit.path.length === 0) {
			if (unit.status === 'moving') {
				console.log(`[GAME] Unit ${unit.id} - Movement complete, going idle at`, unit.position);
				unit.status = 'idle';
				// Only broadcast when transitioning to idle
				this.broadcast('unitMoved', {
					unitId: unit.id,
					position: unit.position,
					status: 'idle',
				});
			}
			return;
		}

		// Initialize visual position if not set
		if (!unit.visualPosition) {
			unit.visualPosition = { ...unit.position };
		}

		const nextPos = unit.path[0];
		const unitStats = UNITS[unit.type];
		const moveSpeed = unitStats.moveSpeed;
		const moveDistance = moveSpeed * deltaTime;

		// Calculate direction and move toward next waypoint
		const dx = nextPos.x - unit.visualPosition.x;
		const dy = nextPos.y - unit.visualPosition.y;
		const distance = Math.sqrt(dx * dx + dy * dy);

		// Debug every 60 ticks
		if (this.tick % 60 === 0) {
			console.log(`[GAME] Unit ${unit.id} - Moving: gridPos=${JSON.stringify(unit.position)}, visualPos=${JSON.stringify(unit.visualPosition)}, next=${JSON.stringify(nextPos)}, dist=${distance.toFixed(4)}, moveDistance=${moveDistance.toFixed(4)}, pathLen=${unit.path.length}`);
		}

		if (distance <= moveDistance) {
			// Reached waypoint - snap to grid position
			unit.position = { ...nextPos };
			unit.visualPosition = { ...nextPos };
			unit.path.shift();

			// Update spatial grid
			this.unitSpatialGrid.update(unit);

			// Broadcast position update for every waypoint
			if (unit.path.length === 0) {
				// Path complete - unit now idle
				console.log(`[GAME] Unit ${unit.id} - Reached final destination`, unit.position);
				unit.status = 'idle';
				this.broadcast('unitMoved', {
					unitId: unit.id,
					position: unit.position,
					status: 'idle',
				});
			} else {
				// Still moving - broadcast intermediate position
				this.broadcast('unitMoved', {
					unitId: unit.id,
					position: unit.position,
					status: 'moving',
				});
			}
		} else {
			// Move incrementally toward next waypoint
			const ratio = moveDistance / distance;
			unit.visualPosition.x += dx * ratio;
			unit.visualPosition.y += dy * ratio;
		}
	}

	gatherResource(unit, deltaTime) {
		const resource = this.resources.get(unit.currentAction?.targetId);

		if (!resource || resource.amount <= 0) {
			unit.status = 'idle';
			unit.currentAction = null;
			return;
		}

		const unitStats = UNITS[unit.type];
		const player = this.players.get(unit.playerId);
		const startingGroup = STARTING_GROUPS[player.startingGroup];
		const bonus = startingGroup.gatheringBonuses[resource.resourceType] || 1.0;

		const gatherRate = resource.gatherRate * bonus;
		const amountGathered = Math.min(gatherRate * deltaTime, resource.amount);

		resource.amount -= amountGathered;
		unit.currentAction.carrying += amountGathered;

		// Return to drop-off when carrying capacity reached
		if (unit.currentAction.carrying >= unitStats.carryCapacity) {
			this.returnResources(unit);
		}

		// Update resource every 10 ticks
		if (this.tick % 10 === 0) {
			this.broadcast('resourceUpdated', {
				resourceId: resource.id,
				amount: resource.amount,
			});
		}
	}

	returnResources(unit) {
		const player = this.players.get(unit.playerId);
		const resourceType = this.resources.get(unit.currentAction.targetId).resourceType;

		// Add to player resources
		player.resources[resourceType] += unit.currentAction.carrying;

		// Broadcast resource update
		this.broadcast('playerResourcesUpdated', {
			playerId: player.id,
			resources: player.resources,
		});

		// Reset carrying
		unit.currentAction.carrying = 0;

		// TODO: Path back to resource to continue gathering
		unit.status = 'idle';
		unit.currentAction = null;
	}

	constructBuilding(unit, deltaTime) {
		const building = this.buildings.get(unit.currentAction?.targetId);

		if (!building || building.constructionProgress >= 1.0) {
			unit.status = 'idle';
			unit.currentAction = null;
			return;
		}

		const unitStats = UNITS[unit.type];
		const buildingStats = BUILDINGS[building.type];

		const buildProgress = unitStats.buildSpeed * deltaTime / buildingStats.constructionTime;
		building.constructionProgress = Math.min(1.0, building.constructionProgress + buildProgress);

		// Update every 10 ticks
		if (this.tick % 10 === 0) {
			this.broadcast('buildingConstructionProgress', {
				buildingId: building.id,
				progress: building.constructionProgress,
			});
		}

		// Complete construction
		if (building.constructionProgress >= 1.0) {
			unit.status = 'idle';
			unit.currentAction = null;

			this.broadcast('buildingCompleted', {
				buildingId: building.id,
			});
		}
	}

	attackTarget(unit, deltaTime) {
		const target = unit.currentAction?.targetType === 'unit'
			? this.units.get(unit.currentAction.targetId)
			: this.buildings.get(unit.currentAction.targetId);

		if (!target || target.health <= 0) {
			unit.status = 'idle';
			unit.currentAction = null;
			return;
		}

		const unitStats = UNITS[unit.type];
		const distance = gridDistance(unit.position, target.position);

		// Check if in range
		if (distance > unitStats.attackRange) {
			// Move closer
			const path = findPath(unit.position, target.position, (pos) => this.isWalkable(pos));
			if (path.length > 0) {
				unit.path = path;
				unit.status = 'moving';
			} else {
				unit.status = 'idle';
				unit.currentAction = null;
			}
			return;
		}

		// Attack cooldown
		unit.currentAction.attackCooldown = (unit.currentAction.attackCooldown || 0) - deltaTime;

		if (unit.currentAction.attackCooldown <= 0) {
			// Deal damage
			const damage = unitStats.attackDamage;
			target.health = Math.max(0, target.health - damage);

			// Reset cooldown
			unit.currentAction.attackCooldown = 1.0 / unitStats.attackSpeed;

			// Broadcast attack
			this.broadcast('unitAttacked', {
				attackerId: unit.id,
				targetId: target.id,
				targetType: unit.currentAction.targetType,
				damage,
				targetHealth: target.health,
			});

			// Check if target destroyed
			if (target.health <= 0) {
				this.handleUnitOrBuildingDestroyed(target, unit.currentAction.targetType);
				unit.status = 'idle';
				unit.currentAction = null;
			}
		}
	}

	checkAutoAttack(unit) {
		const unitStats = UNITS[unit.type];
		const nearby = this.unitSpatialGrid.getNearby(unit.position, unitStats.attackRange);

		for (const target of nearby) {
			if (target.playerId !== unit.playerId && target.health > 0) {
				const distance = gridDistance(unit.position, target.position);
				if (distance <= unitStats.attackRange) {
					// Start attacking
					unit.status = 'attacking';
					unit.currentAction = {
						type: 'attack',
						targetId: target.id,
						targetType: 'unit',
						attackCooldown: 0,
					};
					return;
				}
			}
		}
	}

	updateBuilding(building, deltaTime) {
		if (building.constructionProgress < 1.0) return;

		const buildingStats = BUILDINGS[building.type];

		// Resource production (farms produce food, mines produce iron)
		const player = this.players.get(building.playerId);
		let resourceUpdated = false;

		if (buildingStats.foodProduction) {
			player.resources.food += buildingStats.foodProduction * deltaTime;
			resourceUpdated = true;
		}

		if (buildingStats.ironProduction) {
			player.resources.iron += buildingStats.ironProduction * deltaTime;
			resourceUpdated = true;
		}

		if (resourceUpdated && this.tick % 60 === 0) {
			this.broadcast('playerResourcesUpdated', {
				playerId: player.id,
				resources: player.resources,
			});
		}

		// Unit production queue
		if (building.productionQueue && building.productionQueue.length > 0) {
			const item = building.productionQueue[0];
			const unitStats = UNITS[item.unitType];

			item.progress += deltaTime / unitStats.productionTime;

			if (item.progress >= 1.0) {
				// Spawn unit
				this.spawnUnit(item.unitType, building.playerId, building.rallyPoint || building.position);
				building.productionQueue.shift();

				this.broadcast('unitProduced', {
					buildingId: building.id,
					unitType: item.unitType,
				});
			}

			// Update queue progress every 10 ticks
			if (this.tick % 10 === 0) {
				this.broadcast('productionQueueUpdated', {
					buildingId: building.id,
					queue: building.productionQueue,
				});
			}
		}
	}

	spawnUnit(unitType, playerId, position) {
		const unitStats = UNITS[unitType];
		const unit = {
			id: simpleId(),
			type: unitType,
			playerId,
			position: { ...position },
			health: unitStats.maxHealth,
			maxHealth: unitStats.maxHealth,
			status: 'idle',
			currentAction: null,
			path: null,
			selected: false,
		};

		this.units.set(unit.id, unit);
		this.unitSpatialGrid.add(unit);

		// Update player population
		const player = this.players.get(playerId);
		player.population.current += unitStats.populationCost;

		this.broadcast('unitSpawned', {
			unit,
		});

		return unit;
	}

	placeBuilding(buildingType, playerId, position) {
		const buildingStats = BUILDINGS[buildingType];

		// Validate placement
		const cells = getCellsInRect(position, buildingStats.size);
		for (const cell of cells) {
			if (!this.isBuildable(cell)) {
				return { success: false, error: 'Invalid placement' };
			}
		}

		// Check resources
		const player = this.players.get(playerId);
		for (const [resource, cost] of Object.entries(buildingStats.cost)) {
			if (player.resources[resource] < cost) {
				return { success: false, error: 'Insufficient resources' };
			}
		}

		// Deduct resources
		for (const [resource, cost] of Object.entries(buildingStats.cost)) {
			player.resources[resource] -= cost;
		}

		// Create building
		const building = {
			id: simpleId(),
			type: buildingType,
			playerId,
			position: { ...position },
			size: buildingStats.size,
			health: buildingStats.maxHealth,
			maxHealth: buildingStats.maxHealth,
			constructionProgress: 0.0,
			productionQueue: [],
			rallyPoint: null,
		};

		this.buildings.set(building.id, building);
		this.buildingSpatialGrid.add(building);

		// Update player population if building provides it
		if (buildingStats.populationProvided) {
			player.population.max += buildingStats.populationProvided;
		}

		this.broadcast('buildingPlaced', {
			building,
		});

		this.broadcast('playerResourcesUpdated', {
			playerId: player.id,
			resources: player.resources,
		});

		return { success: true, buildingId: building.id };
	}

	handleUnitOrBuildingDestroyed(target, type) {
		if (type === 'unit') {
			this.unitSpatialGrid.remove(target);
			this.units.delete(target.id);

			// Update population
			const player = this.players.get(target.playerId);
			const unitStats = UNITS[target.type];
			player.population.current -= unitStats.populationCost;

			this.broadcast('unitDestroyed', {
				unitId: target.id,
			});
		} else {
			this.buildingSpatialGrid.remove(target);
			this.buildings.delete(target.id);

			// Update population max if building provided it
			const buildingStats = BUILDINGS[target.type];
			if (buildingStats.populationProvided) {
				const player = this.players.get(target.playerId);
				player.population.max -= buildingStats.populationProvided;
			}

			this.broadcast('buildingDestroyed', {
				buildingId: target.id,
			});
		}
	}

	checkWinConditions() {
		// Check each player's buildings
		const playerBuildingCounts = new Map();

		for (const building of this.buildings.values()) {
			if (building.constructionProgress >= 1.0) {
				playerBuildingCounts.set(
					building.playerId,
					(playerBuildingCounts.get(building.playerId) || 0) + 1
				);
			}
		}

		// Find players with no buildings
		for (const player of this.players.values()) {
			if (!playerBuildingCounts.has(player.id) || playerBuildingCounts.get(player.id) === 0) {
				this.broadcast('playerDefeated', {
					playerId: player.id,
				});

				// Check if only one player remains
				if (playerBuildingCounts.size === 1) {
					const winner = [...playerBuildingCounts.keys()][0];
					this.broadcast('gameOver', {
						winnerId: winner,
					});
					this.stopGameLoop();
				}
			}
		}
	}

	isWalkable(position) {
		// Check terrain
		const terrain = this.world.terrain.find((t) => t.x === position.x && t.y === position.y);
		if (!terrain || !TERRAIN_TYPES[terrain.type].walkable) {
			return false;
		}

		// Check for buildings (simplified - just check position, not size)
		for (const building of this.buildings.values()) {
			const cells = getCellsInRect(building.position, BUILDINGS[building.type].size);
			if (cells.some((cell) => cell.x === position.x && cell.y === position.y)) {
				return false;
			}
		}

		return true;
	}

	isBuildable(position) {
		// Check terrain
		const terrain = this.world.terrain.find((t) => t.x === position.x && t.y === position.y);
		if (!terrain || !TERRAIN_TYPES[terrain.type].buildable) {
			return false;
		}

		// Check for existing buildings
		for (const building of this.buildings.values()) {
			const cells = getCellsInRect(building.position, BUILDINGS[building.type].size);
			if (cells.some((cell) => cell.x === position.x && cell.y === position.y)) {
				return false;
			}
		}

		// Check for resources
		for (const resource of this.resources.values()) {
			if (resource.position.x === position.x && resource.position.y === position.y) {
				return false;
			}
		}

		return true;
	}

	addPlayer(name, startingGroup) {
		const id = simpleId();
		const startingData = STARTING_GROUPS[startingGroup];

		// Find spawn location (simple: place players in corners)
		const playerCount = this.players.size;
		const spawnPositions = [
			{ x: 5, y: 5 },
			{ x: WORLD_CONFIG.width - 10, y: 5 },
			{ x: 5, y: WORLD_CONFIG.height - 10 },
			{ x: WORLD_CONFIG.width - 10, y: WORLD_CONFIG.height - 10 },
		];
		const spawnPos = spawnPositions[playerCount] || { x: 10, y: 10 };

		const player = {
			id,
			name,
			startingGroup,
			resources: { ...startingData.startingResources },
			population: { current: 0, max: 0 },
			techTree: {
				level: 1,
				unlocked: [...startingData.unlockedBuildings],
			},
		};

		this.players.set(id, player);

		// Place starting buildings
		startingData.buildings.forEach(({ type, position }, index) => {
			const adjustedPos = {
				x: spawnPos.x + position.x - 10,
				y: spawnPos.y + position.y - 10,
			};
			const building = {
				id: simpleId(),
				type,
				playerId: id,
				position: adjustedPos,
				size: BUILDINGS[type].size,
				health: BUILDINGS[type].maxHealth,
				maxHealth: BUILDINGS[type].maxHealth,
				constructionProgress: 1.0, // Start buildings are complete
				productionQueue: [],
				rallyPoint: null,
			};

			this.buildings.set(building.id, building);
			this.buildingSpatialGrid.add(building);

			// Update population
			if (BUILDINGS[type].populationProvided) {
				player.population.max += BUILDINGS[type].populationProvided;
			}
		});

		// Spawn starting workers
		for (let i = 0; i < startingData.workers; i++) {
			this.spawnUnit('worker', id, {
				x: spawnPos.x + Math.floor(i / 3),
				y: spawnPos.y + (i % 3),
			});
		}

		this.broadcast('playerJoined', { player });

		return player;
	}

	toClient() {
		return {
			id: this.id,
			name: this.name,
			options: this.options,
			world: this.world,
			players: [...this.players.values()],
			units: [...this.units.values()],
			buildings: [...this.buildings.values()],
			resources: [...this.resources.values()],
		};
	}

	toSaveState() {
		return {
			id: this.id,
			name: this.name,
			options: this.options,
			world: this.world,
			players: [...this.players.values()],
			units: [...this.units.values()],
			buildings: [...this.buildings.values()],
			resources: [...this.resources.values()],
		};
	}
}
