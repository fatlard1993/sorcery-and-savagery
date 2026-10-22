import { basicGameRoutes } from '@fatlard1993/web-game-framework/core';

import gameRouter from './game.js';
import staticRouter from './static.js';

const gameCrudRoutes = basicGameRoutes();

/**
 * The game's own api, the framework's game list, create, join, exit and delete, then the page and its files
 * @param {object} server - The game server
 * @returns {Function} The request handler
 */
export default function router(server) {
	return async request =>
		(await gameRouter(request, server)) ?? (await gameCrudRoutes(request, server)) ?? staticRouter(request);
}
