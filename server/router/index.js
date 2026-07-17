import gameRouter from './game.js';
import staticRouter from './static.js';

/**
 *
 * @param server
 */
export default function router(server) {
	return async req => {
		const url = new URL(req.url, `http://${req.headers.get('host')}`);

		// API routes
		if (url.pathname.startsWith('/api')) {
			const response = await gameRouter(req, server);
			if (response) return response;
		}

		// Static files and SPA
		return staticRouter(req);
	};
}
