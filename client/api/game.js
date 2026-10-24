import { POST } from '@vanilla-bean/components';
import { getGame } from '@fatlard1993/web-game-framework/client';
import gameContext from '../shared/gameContext.js';

export { getGame };

const apiContext = () => ({
	gameId: gameContext.gameId,
	playerId: gameContext.playerId,
});

export const moveUnit = async ({ unitId, path }, options) =>
	await POST('/games/:gameId/players/:playerId/units/:unitId/move', {
		urlParameters: { ...apiContext(), unitId },
		body: { path },
		cache: false,
		...options,
	});

export const placeBuilding = async ({ buildingType, position }, options) =>
	await POST('/games/:gameId/players/:playerId/buildings', {
		urlParameters: apiContext(),
		body: { buildingType, position },
		...options,
	});

export const produceUnit = async ({ buildingId, unitType }, options) =>
	await POST('/games/:gameId/players/:playerId/buildings/:buildingId/produce', {
		urlParameters: { ...apiContext(), buildingId },
		body: { unitType },
		...options,
	});

export const assignTask = async ({ unitId, taskType, targetId, gatherType }, options) =>
	await POST('/games/:gameId/players/:playerId/units/:unitId/task', {
		urlParameters: { ...apiContext(), unitId },
		body: { taskType, targetId, gatherType },
		cache: false,
		...options,
	});

export const chooseSpawnLocation = async ({ position }, options) =>
	await POST('/games/:gameId/players/:playerId/spawn', {
		urlParameters: apiContext(),
		body: { position },
		...options,
	});

export const chooseStartingParty = async ({ gameId, playerId, startingUnits }, options) =>
	await POST('/games/:gameId/players/:playerId/starting-party', {
		urlParameters: { gameId, playerId },
		body: { startingUnits },
		...options,
	});
