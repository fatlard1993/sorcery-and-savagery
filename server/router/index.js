import { basicGameRoutes } from '@fatlard1993/web-game-framework/core';

import staticRouter from './static.js';

const gameCrudRoutes = basicGameRoutes();

/**
 * The framework's game list, create, join, exit and delete, then the page and its files. What a player does in a game
 * goes over the socket as an action (Game's actions).
 * @param {object} server - The game server
 * @returns {Function} The request handler
 */
export default function router(server) {
	return async request => (await gameCrudRoutes(request, server)) ?? staticRouter(request);
}
