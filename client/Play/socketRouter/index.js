import { createClientEventRouter } from '@fatlard1993/web-game-framework/client';
import gameContext from '../../shared/gameContext.js';
import units from './units.js';
import buildings from './buildings.js';
import players from './players.js';

// Registration is explicit per event: a 'unit*' pattern would send
// unitProduced to the units handler, but it belongs to the buildings handler
const handlerEvents = {
	players: ['playerJoined', 'playerResourcesUpdated', 'playerDefeated'],
	units: [
		'unitSpawned',
		'unitMove',
		'unitMoved',
		'unitMoving',
		'unitAttacked',
		'unitDestroyed',
		'unitTaskAssigned',
		'unitGatherProgress',
	],
	buildings: [
		'buildingPlaced',
		'buildingConstructionProgress',
		'buildingCompleted',
		'buildingDestroyed',
		'productionQueueUpdated',
		'unitProduced',
	],
};

function resources(data) {
	// Update resource data in gameContext
	const resourceData = gameContext.resources.get(data.resourceId);
	if (resourceData) {
		resourceData.amount = data.amount;
	}

	// Update resource sprite
	const resource = gameContext.sceneLayers.resources.list.find(obj => obj.resourceId === data.resourceId);
	if (resource && resource.updateAmount) {
		resource.updateAmount(data.amount);
	}
}

function gameOver(data) {
	console.log('Game over! Winner:', data.winnerId);
	// TODO: Show victory/defeat screen
}

export default function createSocketRouter() {
	const router = createClientEventRouter({ gameId: gameContext.gameId });

	const handlers = { players, units, buildings };
	Object.entries(handlerEvents).forEach(([handler, events]) => {
		events.forEach(event => router.on(event, handlers[handler]));
	});

	router.on('resourceUpdated', resources);
	router.on('gameOver', gameOver);

	return router;
}
