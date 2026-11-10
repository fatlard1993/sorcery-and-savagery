import { withErrors } from '@vanilla-bean/components/app';

import router from './index.js';

const DomResponse = globalThis.Response;
// The Server answers a thrown error the way withErrors does
const route = withErrors(router({ games: { g1: { toClient: () => ({ id: 'g1' }) } } }));
const get = path => route(new Request(`http://localhost${path}`));

beforeAll(async () => (globalThis.Response = (await Bun.fetch('data:,')).constructor));
afterAll(() => (globalThis.Response = DomResponse));

test('the game list is the framework route; a page path is the page; a missing file or game path is a 404', async () => {
	expect(await (await get('/games')).json()).toEqual([{ id: 'g1' }]);

	const page = await get('/play/g1');

	expect(page.headers.get('content-type')).toContain('text/html');
	expect(page.headers.get('cache-control')).toBe('no-cache');
	expect((await get('/chunk-gone.js')).status).toBe(404);
	expect((await get('/games/g1/nothing-here')).status).toBe(404);
});
