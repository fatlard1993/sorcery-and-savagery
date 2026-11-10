import { Game as BaseGame, refuse, simpleId } from '@fatlard1993/web-game-framework';
import { UNITS, BUILDINGS, RESOURCE_TYPES, TERRAIN_TYPES, WORLD_CONFIG } from '../constants/index.js';
import { gridDistance, findPath, getCellsInRect, isValidGridPosition } from '../utils/index.js';
import { SpatialGrid } from '../utils/spatial.js';
import { generateWorld } from './worldGenerator.js';

// The most units a building's production queue holds
const MAX_QUEUE = 10;

// A grid cell on the map: whole x and y inside it
const isCell = cell =>
	!!cell &&
	typeof cell === 'object' &&
	Number.isInteger(cell.x) &&
	Number.isInteger(cell.y) &&
	isValidGridPosition(cell);

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
			saveState.units.forEach(unit => {
				this.units.set(unit.id, unit);
				this.unitSpatialGrid.add(unit);
			});
		}

		if (saveState.buildings) {
			saveState.buildings.forEach(building => {
				this.buildings.set(building.id, building);
				this.buildingSpatialGrid.add(building);
			});
		}

		if (saveState.resources) {
			saveState.resources.forEach(resource => {
				this.resources.set(resource.id, resource);
			});
		} else if (this.world.resources) {
			// Initialize resources from freshly generated world
			this.world.resources.forEach(resource => {
				this.resources.set(resource.id, resource);
			});
		}

		// Start game loop
		if (this.server) {
			this.startGameLoop();
		} else {
			console.warn('[GAME] No server, game loop NOT started!');
		}
	}

	// What a player can do, from their page: act('move', { moves }) and the rest. Each runs as the page's own player (never
	// one the message names), refuse('why') turns it down and the page is told why, and every page is sent its view after
	actions = {
		chooseStartingParty(player, { startingUnits } = {}) {
			const result = this.chooseStartingParty(player.id, startingUnits);

			if (!result.success) refuse(result.error);
		},

		spawn(player, { position } = {}) {
			if (!isCell(position)) refuse('Choose a spot on the map');
			if (!this.isBuildable(position)) refuse('The campfire cannot go there');

			const result = this.spawnPlayerAtLocation(player.id, position);

			if (!result.success) refuse(result.error);
		},

		// Each unit walks the path its page found: from where it stands, a step at a time, over ground it can walk
		move(player, { moves } = {}) {
			if (!Array.isArray(moves) || !moves.length) refuse('Nothing to move');

			const units = moves.map(move => {
				const { unitId, path } = move ?? {};
				const unit = this.ownUnit(player, unitId);

				if (!this.isPathFor(unit, path)) refuse('That path cannot be walked');

				return [unit, path];
			});

			for (const [unit, path] of units) {
				unit.path = path.map(({ x, y }) => ({ x, y }));
				unit.status = 'moving';

				this.broadcast('unitMove', { unitId: unit.id, path: unit.path });
			}
		},

		// Gathering from a resource (a forest gives food or wood), or building a site still under construction
		task(player, { unitIds, taskType, targetId, gatherType } = {}) {
			if (!Array.isArray(unitIds) || !unitIds.length) refuse('No units chosen');

			const units = unitIds.map(unitId => this.ownUnit(player, unitId));

			if (taskType === 'gather') {
				const resource = typeof targetId === 'string' && this.resources.get(targetId);

				if (!resource) refuse('Resource not found');

				const gathered = resource.type === 'forest' ? (gatherType ?? 'food') : resource.resourceType;

				if (resource.type === 'forest' && !['food', 'wood'].includes(gathered)) refuse('A forest gives food or wood');

				for (const unit of units)
					this.setTask(unit, 'gathering', { targetId, targetType: 'resource', carrying: 0, gatherType: gathered });
			} else if (taskType === 'build') {
				const building = typeof targetId === 'string' && this.buildings.get(targetId);

				if (!building) refuse('Building not found');

				this.assignBuilders(units, building);
			} else refuse('Invalid task type');
		},

		// A building site, and the units chosen to build it
		placeBuilding(player, { buildingType, position, builders = [] } = {}) {
			if (!Object.hasOwn(BUILDINGS, buildingType ?? '')) refuse('No such building');
			if (!isCell(position)) refuse('Choose a spot on the map');
			if (!Array.isArray(builders)) refuse('Builders are a list of units');

			const units = builders.map(unitId => this.ownUnit(player, unitId));
			const result = this.placeBuilding(buildingType, player.id, position);

			if (!result.success) refuse(result.error);

			this.assignBuilders(units, this.buildings.get(result.buildingId), { quiet: true });
		},

		produce(player, { buildingId, unitType } = {}) {
			const building = typeof buildingId === 'string' && this.buildings.get(buildingId);

			if (!building || building.playerId !== player.id) refuse('Building not found');
			if (building.constructionProgress < 1.0) refuse('The building is not finished');
			if (!BUILDINGS[building.type].produces.includes(unitType)) refuse('That building cannot make that unit');
			if (building.productionQueue.length >= MAX_QUEUE) refuse(`At most ${MAX_QUEUE} units wait in a queue`);

			building.productionQueue.push({ unitType, progress: 0 });

			this.broadcast('productionQueueUpdated', { buildingId, queue: building.productionQueue });
		},
	};

	// What a page sends is whatever it sends: nothing at all (null) is read as no fields, and refused for what's missing
	act(playerId, name, data) {
		return super.act(playerId, name, data ?? {});
	}

	ownUnit(player, unitId) {
		const unit = typeof unitId === 'string' && this.units.get(unitId);

		if (!unit || unit.playerId !== player.id) refuse('Unit not found');

		return unit;
	}

	// A path from where the unit stands (or the step it is on its way to), a step at a time over walkable ground
	isPathFor(unit, path) {
		if (!Array.isArray(path) || !path.length || path.length > WORLD_CONFIG.width * WORLD_CONFIG.height) return false;

		let from = unit.position;

		for (const [at, cell] of path.entries()) {
			if (!isCell(cell) || gridDistance(from, cell) > (at === 0 ? 2 : 1) || !this.isWalkable(cell)) return false;
			from = cell;
		}

		return true;
	}

	setTask(unit, status, currentAction) {
		unit.status = status;
		unit.currentAction = currentAction;

		this.broadcast('unitTaskAssigned', { unitId: unit.id, status, currentAction });
	}

	// Each builder takes its own free spot around the site; with none left for any of them, the task is refused (a site
	// just placed is placed anyway: quiet)
	assignBuilders(units, building, { quiet = false } = {}) {
		let assigned = 0;

		for (const unit of units) {
			const buildPosition = this.findBuildPositionForUnit(building, unit);

			if (!buildPosition) continue;

			this.setTask(unit, 'building', { targetId: building.id, targetType: 'building', buildPosition });
			assigned++;
		}

		if (units.length && !assigned && !quiet) refuse('No available build position');
	}

	// The loop stops by itself when the game is deleted (every, stopped on dispose); an error in one tick is logged and
	// the loop carries on
	startGameLoop() {
		this.lastTick = Date.now();
		this.gameLoop = this.every(this.tickInterval, () => {
			const now = Date.now();
			const deltaTime = (now - this.lastTick) / 1000;
			this.gameTick(deltaTime);
			this.lastTick = now;
			this.tick++;
		});
	}

	stopGameLoop() {
		if (this.gameLoop) {
			clearInterval(this.gameLoop);
			this._loops?.delete(this.gameLoop);
			this.gameLoop = null;
		}
	}

	gameTick(deltaTime) {
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

		// A player's resources or population changed: every page is sent its view
		if (this.playersChanged) this.publish();
	}

	publish() {
		this.playersChanged = false;
		super.publish();
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
		if (!unit.path || unit.path.length === 0) {
			if (unit.status === 'moving') {
				// Check if unit has a task to resume after moving
				if (unit.currentAction) {
					if (unit.currentAction.targetType === 'resource') {
						// Check if returning to town center or going to resource
						if (unit.currentAction.returning) {
							// Just arrived at town center - call returnResources to deposit and path back
							delete unit.currentAction.returning;
							this.returnResources(unit);
							return;
						} else {
							// Arrived at resource - start gathering
							unit.status = 'gathering';
							this.broadcast('unitMoved', {
								unitId: unit.id,
								position: unit.position,
								status: 'gathering',
							});
							return;
						}
					} else if (unit.currentAction.targetType === 'building') {
						// Arrived at building - start building
						unit.status = 'building';
						this.broadcast('unitMoved', {
							unitId: unit.id,
							position: unit.position,
							status: 'building',
						});
						return;
					}
				}

				// No task - go idle
				unit.status = 'idle';
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

		if (distance <= moveDistance) {
			// Reached waypoint - snap to grid position
			unit.position = { ...nextPos };
			unit.visualPosition = { ...nextPos };
			unit.path.shift();

			// Update spatial grid
			this.unitSpatialGrid.update(unit);

			// Only broadcast intermediate waypoints, not the final one
			// (final destination is handled at the top of this function)
			if (unit.path.length > 0) {
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

		// Check if unit is at the resource location
		const distance = gridDistance(unit.position, resource.position);
		if (distance > 1) {
			// Not at resource yet - move to it
			const path = findPath(unit.position, resource.position, pos => this.isWalkable(pos));
			if (path.length > 0) {
				unit.path = path;
				unit.status = 'moving';
				// Keep currentAction so we know to gather when we arrive
			} else {
				// No path to resource
				unit.status = 'idle';
				unit.currentAction = null;
			}
			return;
		}

		// At resource - gather

		const unitStats = UNITS[unit.type];
		const bonus = 1.0;

		// For forests, use different gather rates for food vs wood
		const gatherType = unit.currentAction.gatherType || resource.resourceType;
		let gatherRate;

		if (resource.type === 'forest') {
			// Forest: food is unlimited (berries/game), wood depletes the resource
			if (gatherType === 'food') {
				gatherRate = RESOURCE_TYPES.forest.gatherRate * bonus;
				// Food doesn't deplete forest, just gather
				const amountGathered = gatherRate * deltaTime;
				unit.currentAction.carrying += amountGathered;
			} else {
				// Chopping wood depletes the forest
				gatherRate = RESOURCE_TYPES.forest.chopRate * bonus;
				const amountGathered = Math.min(gatherRate * deltaTime, resource.amount);
				resource.amount -= amountGathered;
				unit.currentAction.carrying += amountGathered;
			}
		} else {
			// Other resources: normal gathering
			gatherRate = resource.gatherRate * bonus;
			const amountGathered = Math.min(gatherRate * deltaTime, resource.amount);
			resource.amount -= amountGathered;
			unit.currentAction.carrying += amountGathered;
		}

		// Return to drop-off when carrying capacity reached
		if (unit.currentAction.carrying >= unitStats.carryCapacity) {
			this.returnResources(unit);
		}

		// Update resource and gathering progress every 10 ticks
		if (this.tick % 10 === 0) {
			this.broadcast('resourceUpdated', {
				resourceId: resource.id,
				amount: resource.amount,
			});

			this.broadcast('unitGatherProgress', {
				unitId: unit.id,
				carrying: unit.currentAction?.carrying || 0,
				capacity: unitStats.carryCapacity,
			});
		}
	}

	returnResources(unit) {
		const player = this.players.get(unit.playerId);

		// Find player's town center (or any building for drop-off)
		let townCenter = null;
		for (const building of this.buildings.values()) {
			if (
				building.playerId === unit.playerId &&
				building.type === 'townCenter' &&
				building.constructionProgress >= 1.0
			) {
				townCenter = building;
				break;
			}
		}

		// If no town center, find any completed building
		if (!townCenter) {
			for (const building of this.buildings.values()) {
				if (building.playerId === unit.playerId && building.constructionProgress >= 1.0) {
					townCenter = building;
					break;
				}
			}
		}

		if (!townCenter) {
			// No drop-off point - just add resources immediately and go idle
			const resourceType =
				unit.currentAction.gatherType || this.resources.get(unit.currentAction.targetId).resourceType;
			player.resources[resourceType] += unit.currentAction.carrying;

			this.playersChanged = true;

			unit.status = 'idle';
			unit.currentAction = null;
			return;
		}

		// Check if already at town center
		const distance = gridDistance(unit.position, townCenter.position);
		if (distance <= 2) {
			// At town center - deposit resources
			const resourceType =
				unit.currentAction.gatherType || this.resources.get(unit.currentAction.targetId).resourceType;
			player.resources[resourceType] += unit.currentAction.carrying;

			this.playersChanged = true;

			// Reset carrying
			unit.currentAction.carrying = 0;

			// Path back to resource to continue gathering
			const resource = this.resources.get(unit.currentAction.targetId);
			if (resource && resource.amount > 0) {
				const path = findPath(unit.position, resource.position, pos => this.isWalkable(pos));
				if (path.length > 0) {
					unit.path = path;
					unit.status = 'moving';
					// Keep currentAction with targetId so unit continues gathering after arriving
				} else {
					// No path back to resource
					unit.status = 'idle';
					unit.currentAction = null;
				}
			} else {
				// Resource depleted
				unit.status = 'idle';
				unit.currentAction = null;
			}
		} else {
			// Not at town center yet - path to it
			const path = findPath(unit.position, townCenter.position, pos => this.isWalkable(pos));
			if (path.length > 0) {
				unit.path = path;
				unit.status = 'moving';
				unit.currentAction.returning = true; // Flag to know we're returning
			} else {
				// No path to town center - just add resources and go idle
				const resourceType =
					unit.currentAction.gatherType || this.resources.get(unit.currentAction.targetId).resourceType;
				player.resources[resourceType] += unit.currentAction.carrying;

				this.playersChanged = true;

				unit.status = 'idle';
				unit.currentAction = null;
			}
		}
	}

	constructBuilding(unit, deltaTime) {
		const building = this.buildings.get(unit.currentAction?.targetId);

		if (!building) {
			unit.status = 'idle';
			unit.currentAction = null;
			return;
		}

		if (building.constructionProgress >= 1.0) {
			unit.status = 'idle';
			unit.currentAction = null;
			return;
		}

		// Check if unit is at the building location
		const distance = gridDistance(unit.position, building.position);
		const buildingStats = BUILDINGS[building.type];
		const maxDistance = Math.max(buildingStats.size.width, buildingStats.size.height) + 1;

		if (distance > maxDistance) {
			// Not at building yet - move to assigned build position

			const target = unit.currentAction.buildPosition;
			if (!target) {
				unit.status = 'idle';
				unit.currentAction = null;
				return;
			}

			const path = findPath(unit.position, target, pos => this.isWalkable(pos));
			if (path.length > 0) {
				unit.path = path;
				unit.status = 'moving';
			} else {
				unit.status = 'idle';
				unit.currentAction = null;
			}
			return;
		}

		const unitStats = UNITS[unit.type];

		const buildProgress = (unitStats.buildSpeed * deltaTime) / buildingStats.constructionTime;
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
		const target =
			unit.currentAction?.targetType === 'unit'
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
			const path = findPath(unit.position, target.position, pos => this.isWalkable(pos));
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
			this.playersChanged = true;
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
		this.playersChanged = true;

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

		// Check proximity requirement (campfires are free to place, others need proximity)
		if (buildingType !== 'campfire') {
			const playerBuildings = Array.from(this.buildings.values()).filter(
				b => b.playerId === playerId && b.constructionProgress >= 1.0,
			);

			if (playerBuildings.length === 0) {
				return { success: false, error: 'Must build a campfire first' };
			}

			// Must be within 10 tiles of an existing building
			let nearAnyBuilding = false;
			for (const existingBuilding of playerBuildings) {
				const distance = gridDistance(position, existingBuilding.position);
				if (distance <= 10) {
					nearAnyBuilding = true;
					break;
				}
			}

			if (!nearAnyBuilding) {
				return { success: false, error: 'Must build within 10 tiles of existing buildings' };
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

		this.playersChanged = true;

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
			this.playersChanged = true;

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
				this.playersChanged = true;
			}

			this.broadcast('buildingDestroyed', {
				buildingId: target.id,
			});
		}
	}

	findBuildPositionForUnit(building, unit) {
		const buildingStats = BUILDINGS[building.type];

		// Collect ALL adjacent walkable tiles around the building perimeter
		const neighbors = [];
		// Top edge
		for (let x = building.position.x - 1; x <= building.position.x + buildingStats.size.width; x++) {
			neighbors.push({ x, y: building.position.y - 1 });
		}
		// Bottom edge
		for (let x = building.position.x - 1; x <= building.position.x + buildingStats.size.width; x++) {
			neighbors.push({ x, y: building.position.y + buildingStats.size.height });
		}
		// Left edge (excluding corners already added)
		for (let y = building.position.y; y < building.position.y + buildingStats.size.height; y++) {
			neighbors.push({ x: building.position.x - 1, y });
		}
		// Right edge (excluding corners already added)
		for (let y = building.position.y; y < building.position.y + buildingStats.size.height; y++) {
			neighbors.push({ x: building.position.x + buildingStats.size.width, y });
		}

		// Find which adjacent tiles are already occupied or assigned
		const occupiedTiles = new Set();
		for (const otherUnit of this.units.values()) {
			if (
				otherUnit.id !== unit.id &&
				otherUnit.status === 'building' &&
				otherUnit.currentAction?.targetId === building.id &&
				otherUnit.currentAction?.buildPosition
			) {
				// Unit has an assigned build position
				const pos = otherUnit.currentAction.buildPosition;
				occupiedTiles.add(`${pos.x},${pos.y}`);
			}
		}

		// Try to find an unoccupied walkable tile
		for (const target of neighbors) {
			const tileKey = `${target.x},${target.y}`;
			if (this.isWalkable(target) && !occupiedTiles.has(tileKey)) {
				return target;
			}
		}

		return null; // No available position
	}

	checkWinConditions() {
		// Check each player's buildings and units
		const playerBuildingCounts = new Map();
		const playerUnitCounts = new Map();

		for (const building of this.buildings.values()) {
			if (building.constructionProgress >= 1.0) {
				playerBuildingCounts.set(building.playerId, (playerBuildingCounts.get(building.playerId) || 0) + 1);
			}
		}

		for (const unit of this.units.values()) {
			if (unit.health > 0) {
				playerUnitCounts.set(unit.playerId, (playerUnitCounts.get(unit.playerId) || 0) + 1);
			}
		}

		// Find players with no buildings AND no units: not one still choosing a party or a spot, who has yet to have any
		// (they'd lose before starting, and the one already playing win, its loop stopped); each is said once
		const defeatedPlayers = new Set();
		for (const player of this.players.values()) {
			if (player.choosingParty || player.pendingSpawn) continue;

			const hasBuildings = playerBuildingCounts.has(player.id) && playerBuildingCounts.get(player.id) > 0;
			const hasUnits = playerUnitCounts.has(player.id) && playerUnitCounts.get(player.id) > 0;

			if (!hasBuildings && !hasUnits) {
				defeatedPlayers.add(player.id);

				if (!player.defeated) {
					player.defeated = true;
					this.broadcast('playerDefeated', {
						playerId: player.id,
					});
				}
			}
		}

		// Check if only one player remains (has buildings or units)
		const remainingPlayers = [...this.players.keys()].filter(id => !defeatedPlayers.has(id));
		if (remainingPlayers.length === 1 && this.players.size > 1) {
			this.broadcast('gameOver', {
				winnerId: remainingPlayers[0],
			});
			this.stopGameLoop();
		}
	}

	isWalkable(position) {
		// Check terrain
		const terrain = this.world.terrain.find(t => t.x === position.x && t.y === position.y);
		if (!terrain) {
			return false;
		}

		const terrainType = TERRAIN_TYPES[terrain.type];
		if (!terrainType || !terrainType.walkable) {
			return false;
		}

		// Check for buildings
		for (const building of this.buildings.values()) {
			const buildingStats = BUILDINGS[building.type];
			if (!buildingStats) continue;

			const cells = getCellsInRect(building.position, buildingStats.size);
			if (cells.some(cell => cell.x === position.x && cell.y === position.y)) {
				return false;
			}
		}

		return true;
	}

	isBuildable(position) {
		// Check terrain
		const terrain = this.world.terrain.find(t => t.x === position.x && t.y === position.y);
		if (!terrain || !TERRAIN_TYPES[terrain.type].buildable) {
			return false;
		}

		// Check for existing buildings
		for (const building of this.buildings.values()) {
			const cells = getCellsInRect(building.position, BUILDINGS[building.type].size);
			if (cells.some(cell => cell.x === position.x && cell.y === position.y)) {
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

	// A player joins with a name, then chooses a starting party
	createPlayer() {
		return {
			resources: { wood: 200, stone: 150, iron: 100, water: 100, food: 150 },
			population: { current: 0, max: 50 },
			techTree: {
				level: 1,
				unlocked: ['house', 'barracks', 'archery_range', 'tower'],
			},
			choosingParty: true,
		};
	}

	chooseStartingParty(playerId, startingUnits) {
		const player = this.players.get(playerId);
		if (!player?.choosingParty) {
			return { success: false, error: 'Player not found or party already chosen' };
		}

		if (!Array.isArray(startingUnits) || !startingUnits.length || !startingUnits.every(unit => UNITS[unit?.type])) {
			return { success: false, error: 'A starting party is a non-empty list of units' };
		}

		// More workers = more starting resources: +15% per worker
		const workerCount = startingUnits.filter(u => u.type === 'worker').length;
		const resourceMultiplier = 1 + workerCount * 0.15;

		for (const resource of Object.keys(player.resources)) {
			player.resources[resource] = Math.floor(player.resources[resource] * resourceMultiplier);
		}

		delete player.choosingParty;

		// The player chooses a spawn location next
		player.pendingSpawn = {
			startingUnits: startingUnits.map(({ type }) => ({ type })),
			needsLocationChoice: true,
		};

		return { success: true, player };
	}

	onPlayerAdded() {
		this.publish();
	}

	onPresence() {
		this.publish();
	}

	// A player who leaves takes their units and buildings with them
	onPlayerRemoved(playerId) {
		for (const unit of [...this.units.values()]) {
			if (unit.playerId !== playerId) continue;

			this.unitSpatialGrid.remove(unit);
			this.units.delete(unit.id);
			this.broadcast('unitDestroyed', { unitId: unit.id });
		}

		for (const building of [...this.buildings.values()]) {
			if (building.playerId !== playerId) continue;

			this.buildingSpatialGrid.remove(building);
			this.buildings.delete(building.id);
			this.broadcast('buildingDestroyed', { buildingId: building.id });
		}

		this.publish();
	}

	// Called when player chooses their spawn location
	spawnPlayerAtLocation(playerId, spawnPosition) {
		const player = this.players.get(playerId);
		if (!player || !player.pendingSpawn) {
			return { success: false, error: 'Player not found or already spawned' };
		}

		const { startingUnits } = player.pendingSpawn;

		// Spawn campfire at chosen location
		const campfire = {
			id: simpleId(),
			type: 'campfire',
			playerId,
			position: { ...spawnPosition },
			health: BUILDINGS.campfire.maxHealth,
			maxHealth: BUILDINGS.campfire.maxHealth,
			constructionProgress: 1.0, // Start complete
			productionQueue: [],
		};
		this.buildings.set(campfire.id, campfire);
		this.buildingSpatialGrid.add(campfire);

		// Spawn units in walkable positions around campfire
		for (const unit of startingUnits) {
			// Find walkable position in a spiral around spawn point
			let foundPosition = false;
			for (let radius = 0; radius < 10 && !foundPosition; radius++) {
				for (let dx = -radius; dx <= radius && !foundPosition; dx++) {
					for (let dy = -radius; dy <= radius && !foundPosition; dy++) {
						if (Math.abs(dx) === radius || Math.abs(dy) === radius) {
							const pos = { x: spawnPosition.x + dx, y: spawnPosition.y + dy };
							if (this.isWalkable(pos)) {
								// Check if not occupied by another just-spawned unit
								let occupied = false;
								for (const otherUnit of this.units.values()) {
									if (otherUnit.position.x === pos.x && otherUnit.position.y === pos.y) {
										occupied = true;
										break;
									}
								}
								if (!occupied) {
									this.spawnUnit(unit.type, playerId, pos);
									foundPosition = true;
								}
							}
						}
					}
				}
			}
		}

		delete player.pendingSpawn;

		return { success: true, player };
	}

	// What each page is sent as the game changes (publish): the players, with each player's own resources and party on
	// their page alone. Units, buildings and the map arrive as they change (broadcast), on the game the page fetched.
	viewFor(playerId) {
		return {
			players: [...this.players.values()].map(player =>
				player.id === playerId ? { ...player, online: this.online.has(player.id) } : this.publicPlayer(player),
			),
		};
	}

	// A player as anyone sees them: not their stockpile, nor the party they have yet to place
	publicPlayer(player) {
		const { resources: _resources, pendingSpawn, ...seen } = player;

		return { ...seen, ...(pendingSpawn && { pendingSpawn: true }), online: this.online.has(player.id) };
	}

	// The framework's id, name and options, the players as anyone sees them, and the map
	toClient() {
		return {
			...super.toClient(),
			players: [...this.players.values()].map(player => this.publicPlayer(player)),
			world: this.world,
			units: [...this.units.values()],
			buildings: [...this.buildings.values()],
			resources: [...this.resources.values()],
		};
	}

	// The framework's save (the players and their secrets) and the map
	toSaveState() {
		return {
			...super.toSaveState(),
			world: this.world,
			units: [...this.units.values()],
			buildings: [...this.buildings.values()],
			resources: [...this.resources.values()],
		};
	}
}
