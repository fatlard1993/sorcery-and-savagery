import router from './index.js';

const DomResponse = globalThis.Response;
const route = router({ games: {} });
const get = path => route(new Request(`http://localhost${path}`));

beforeAll(async () => (globalThis.Response = (await Bun.fetch('data:,')).constructor));
afterAll(() => (globalThis.Response = DomResponse));

test('a route the client owns is the page; a file that is not there, or an unknown api path, is a 404', async () => {
	const page = await get('/games/g1');

	expect(page.headers.get('content-type')).toContain('text/html');
	expect(page.headers.get('cache-control')).toBe('no-cache');
	expect((await get('/chunk-gone.js')).status).toBe(404);
	expect((await get('/api/nothing-here')).status).toBe(404);
});

test('a body that is not JSON is a 400, not a server error', async () => {
	const answer = await route(
		new Request('http://localhost/api/games', {
			method: 'POST',
			body: '{bad',
			headers: { 'content-type': 'application/json' },
		}),
	);

	expect(answer.status).toBe(400);
});
