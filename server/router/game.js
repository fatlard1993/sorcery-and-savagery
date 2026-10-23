import { requestMatch } from '@vanilla-bean/components/app';

const gameRouter = async (request, server) => {
	let match;

	// Choose the starting party, once, after joining
	match = requestMatch('POST', '/games/:gameId/players/:playerId/starting-party', request);
	if (match) {
		const game = server.games[match.gameId];
		if (!game) {
			return Response.json({ error: 'Game not found' }, { status: 404 });
		}

		const { startingUnits } = await request.json();
		const result = game.chooseStartingParty(match.playerId, startingUnits);

		if (!result.success) {
			return Response.json({ error: result.error }, { status: 400 });
		}

		return Response.json(result.player);
	}

	// Move unit
	match = requestMatch('POST', '/games/:gameId/players/:playerId/units/:unitId/move', request);
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

		unit.path = path;
		unit.status = 'moving';

		game.broadcast('unitMove', { unitId: match.unitId, path });
		game.save(); // Trigger save to persist movement

		return new Response('OK');
	}

	// Place building
	match = requestMatch('POST', '/games/:gameId/players/:playerId/buildings', request);
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
	match = requestMatch('POST', '/games/:gameId/players/:playerId/buildings/:buildingId/produce', request);
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
	match = requestMatch('POST', '/games/:gameId/players/:playerId/units/:unitId/task', request);
	if (match) {
		const game = server.games[match.gameId];
		if (!game) {
			return Response.json({ error: 'Game not found' }, { status: 404 });
		}

		const unit = game.units.get(match.unitId);
		if (!unit || unit.playerId !== match.playerId) {
			return Response.json({ error: 'Unit not found' }, { status: 404 });
		}

		const { taskType, targetId, gatherType } = await request.json();

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
				gatherType: gatherType || resource.resourceType, // Default to resource's type
			};
		} else if (taskType === 'build') {
			const building = game.buildings.get(targetId);
			if (!building) {
				return Response.json({ error: 'Building not found' }, { status: 404 });
			}

			// Find an unoccupied build position for this unit
			const buildPosition = game.findBuildPositionForUnit(building, unit);
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

	// Choose spawn location
	match = requestMatch('POST', '/games/:gameId/players/:playerId/spawn', request);
	if (match) {
		const game = server.games[match.gameId];
		if (!game) {
			return Response.json({ error: 'Game not found' }, { status: 404 });
		}

		const { position } = await request.json();
		const result = game.spawnPlayerAtLocation(match.playerId, position);

		if (!result.success) {
			return Response.json({ error: result.error }, { status: 400 });
		}

		game.save();

		return Response.json({ success: true });
	}
};

export default gameRouter;
