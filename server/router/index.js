import { nanoid } from 'nanoid';
import gameRouter from './game.js';
import staticRouter from './static.js';

/**
 *
 * @param server
 */
export default function router(server) {
	return async (req) => {
		const url = new URL(req.url, `http://${req.headers.get('host')}`);

		// WebSocket upgrade
		if (url.pathname === '/ws') {
			const success = server.httpServer.upgrade(req, {
				data: { clientId: nanoid() },
			});

			return success
				? undefined
				: new Response('WebSocket upgrade failed', { status: 400 });
		}

		// API routes
		if (url.pathname.startsWith('/api')) {
			const response = await gameRouter(req, server);
			if (response) return response;
		}

		// Static files and SPA
		return staticRouter(req);
	};
}
