import { withErrors } from '@vanilla-bean/components/app';

import gameRouter from './game.js';
import staticRouter from './static.js';

/**
 * The game's api, then its files and pages; a thrown error becomes an answer (bad JSON a 400, the rest a 500)
 * @param {object} server - The game server
 * @returns {Function} The request handler
 */
export default function router(server) {
	return withErrors(async request => {
		if (new URL(request.url).pathname.startsWith('/api')) {
			const response = await gameRouter(request, server);

			if (response) return response;
		}

		return staticRouter(request);
	});
}
