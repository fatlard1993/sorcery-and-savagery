import requestMatch from '../../byod-web-game/server/requestMatch.js';

const gameRouter = async (request, server) => {
	let match;

	// Create new game
	match = requestMatch('POST', '/api/games', request);
	if (match) {
		const { name, startingGroup } = await request.json();

		const game = new server.Game({
			name: name || 'New Game',
			server,
		});

		server.games[game.id] = game;
		game.save();

		return Response.json({ gameId: game.id }, { status: 201 });
	}

	// Get all games
	match = requestMatch('GET', '/api/games', request);
	if (match) {
		const games = Object.values(server.games).filter(g => g).map((game) => ({
			id: game.id,
			name: game.name,
			playerCount: game.players.size,
		}));

		return Response.json(games);
	}

	// Join game
	match = requestMatch('POST', '/api/games/:gameId/join', request);
	if (match) {
		const game = server.games[match.gameId];
		if (!game) {
			return Response.json({ error: 'Game not found' }, { status: 404 });
		}

		const { playerName, startingUnits } = await request.json();
		const player = game.addPlayer(playerName, startingUnits);

		return Response.json({ playerId: player.id, game: game.toClient() }, { status: 201 });
	}

	// Get game state
	match = requestMatch('GET', '/api/games/:gameId', request);
	if (match) {
		const game = server.games[match.gameId];
		if (!game) {
			return Response.json({ error: 'Game not found' }, { status: 404 });
		}

		return Response.json(game.toClient());
	}

	// Move unit
	match = requestMatch('POST', '/api/games/:gameId/players/:playerId/units/:unitId/move', request);
	if (match) {
		const game = server.games[match.gameId];
		if (!game) {
			return Response.json({ error: 'Game not found' }, { status: 404 });
		}

		const unit = game.units.get(match.unitId);
		if (!unit || unit.playerId !== match.playerId) {
			return Response.json({ error: 'Unit not found' }, { status: 404 });
		}

		const { path } = await request.json();

		console.log(`[MOVE] Unit ${match.unitId} - Current pos:`, unit.position, 'Status:', unit.status, 'Path length:', path.length);

		unit.path = path;
		unit.status = 'moving';

		game.broadcast('unitMove', { unitId: match.unitId, path });
		game.save(); // Trigger save to persist movement

		console.log(`[MOVE] Unit ${match.unitId} - Set to moving, path:`, path.slice(0, 3), '...');

		return new Response('OK');
	}

	// Place building
	match = requestMatch('POST', '/api/games/:gameId/players/:playerId/buildings', request);
	if (match) {
		const game = server.games[match.gameId];
		if (!game) {
			return Response.json({ error: 'Game not found' }, { status: 404 });
		}

		const { buildingType, position } = await request.json();
		const result = game.placeBuilding(buildingType, match.playerId, position);

		if (!result.success) {
			return Response.json({ error: result.error }, { status: 400 });
		}

		return Response.json({ buildingId: result.buildingId }, { status: 201 });
	}

	// Queue unit production
	match = requestMatch('POST', '/api/games/:gameId/players/:playerId/buildings/:buildingId/produce', request);
	if (match) {
		const game = server.games[match.gameId];
		if (!game) {
			return Response.json({ error: 'Game not found' }, { status: 404 });
		}

		const building = game.buildings.get(match.buildingId);
		if (!building || building.playerId !== match.playerId) {
			return Response.json({ error: 'Building not found' }, { status: 404 });
		}

		const { unitType } = await request.json();

		building.productionQueue.push({
			unitType,
			progress: 0,
		});

		game.broadcast('productionQueueUpdated', {
			buildingId: match.buildingId,
			queue: building.productionQueue,
		});

		return new Response('OK');
	}

	// Assign task to unit (gather resource or build)
	match = requestMatch('POST', '/api/games/:gameId/players/:playerId/units/:unitId/task', request);
	if (match) {
		const game = server.games[match.gameId];
		if (!game) {
			return Response.json({ error: 'Game not found' }, { status: 404 });
		}

		const unit = game.units.get(match.unitId);
		if (!unit || unit.playerId !== match.playerId) {
			return Response.json({ error: 'Unit not found' }, { status: 404 });
		}

		const { taskType, targetId } = await request.json();

		// Validate task type
		if (!['gather', 'build'].includes(taskType)) {
			return Response.json({ error: 'Invalid task type' }, { status: 400 });
		}

		// Validate target exists
		if (taskType === 'gather') {
			const resource = game.resources.get(targetId);
			if (!resource) {
				return Response.json({ error: 'Resource not found' }, { status: 404 });
			}

			// Set unit to gathering status
			unit.status = 'gathering';
			unit.currentAction = {
				targetId,
				targetType: 'resource',
				carrying: 0,
			};
		} else if (taskType === 'build') {
			const building = game.buildings.get(targetId);
			if (!building) {
				return Response.json({ error: 'Building not found' }, { status: 404 });
			}

			// Find an unoccupied build position for this unit
			const buildPosition = game.findBuildPositionForUnit(building, unit);
			console.log(`[ASSIGN] Unit ${match.unitId} assigned build position:`, buildPosition, 'for building at:', building.position);
			if (!buildPosition) {
				return Response.json({ error: 'No available build position' }, { status: 400 });
			}

			// Set unit to building status with assigned position
			unit.status = 'building';
			unit.currentAction = {
				targetId,
				targetType: 'building',
				buildPosition, // Store the assigned position
			};
		}

		game.broadcast('unitTaskAssigned', {
			unitId: match.unitId,
			status: unit.status,
			currentAction: unit.currentAction,
		});
		game.save();

		return new Response('OK');
	}
};

export default gameRouter;
