import { GET, POST } from '@vanilla-bean/hypertether';
import gameContext from '../shared/gameContext.js';

const apiContext = () => ({
	gameId: gameContext.gameId,
	playerId: gameContext.playerId,
});

export const createGame = async options =>
	await POST('/api/games', {
		...options,
	});

export const joinGame = async ({ gameId, ...options }) =>
	await POST(`/api/games/${gameId}/join`, {
		...options,
	});

export const getGames = async options =>
	await GET('/api/games', {
		...options,
	});

export const getGame = async ({ gameId }, options) =>
	await GET(`/api/games/${gameId}`, {
		...options,
	});

export const moveUnit = async ({ unitId, path }, options) =>
	await POST('/api/games/:gameId/players/:playerId/units/:unitId/move', {
		urlParameters: { ...apiContext(), unitId },
		body: { path },
		cache: false,
		...options,
	});

export const placeBuilding = async ({ buildingType, position }, options) =>
	await POST('/api/games/:gameId/players/:playerId/buildings', {
		urlParameters: apiContext(),
		body: { buildingType, position },
		...options,
	});

export const produceUnit = async ({ buildingId, unitType }, options) =>
	await POST('/api/games/:gameId/players/:playerId/buildings/:buildingId/produce', {
		urlParameters: { ...apiContext(), buildingId },
		body: { unitType },
		...options,
	});

export const assignTask = async ({ unitId, taskType, targetId, gatherType }, options) =>
	await POST('/api/games/:gameId/players/:playerId/units/:unitId/task', {
		urlParameters: { ...apiContext(), unitId },
		body: { taskType, targetId, gatherType },
		cache: false,
		...options,
	});

export const chooseSpawnLocation = async ({ position }, options) =>
	await POST('/api/games/:gameId/players/:playerId/spawn', {
		urlParameters: apiContext(),
		body: { position },
		...options,
	});
