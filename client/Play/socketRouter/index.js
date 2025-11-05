import gameContext from '../../shared/gameContext.js';
import units from './units.js';
import buildings from './buildings.js';
import players from './players.js';

/**
 *
 * @param data
 */
export default function socketRouter(data) {
	console.log('Socket message:', data);

	// Validate game ID
	if (data.id !== gameContext.gameId) {
		console.warn('Message for different game, ignoring');
		return;
	}

	// Route to appropriate handler based on update type
	switch (data.update) {
		// Player updates
		case 'playerJoined':
		case 'playerResourcesUpdated':
		case 'playerDefeated':
			players(data);
			break;

		// Unit updates
		case 'unitSpawned':
		case 'unitMove':
		case 'unitMoved':
		case 'unitMoving':
		case 'unitAttacked':
		case 'unitDestroyed':
		case 'unitTaskAssigned':
			units(data);
			break;

		// Building updates
		case 'buildingPlaced':
		case 'buildingConstructionProgress':
		case 'buildingCompleted':
		case 'buildingDestroyed':
		case 'productionQueueUpdated':
		case 'unitProduced':
			buildings(data);
			break;

		// Resource updates
		case 'resourceUpdated':
			const resource = gameContext.scene.children.list.find(
				(obj) => obj.resourceId === data.resourceId
			);
			if (resource) {
				resource.updateAmount(data.amount);
			}
			break;

		// Game over
		case 'gameOver':
			console.log('Game over! Winner:', data.winnerId);
			// TODO: Show victory/defeat screen
			break;

		default:
			console.warn('Unknown update type:', data.update);
	}
}
