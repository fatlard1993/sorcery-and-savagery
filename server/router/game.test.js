import gameRouter from './game.js';

const join = (server, gameId, body) =>
	gameRouter(
		new Request(`http://localhost/api/games/${gameId}/join`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: typeof body === 'string' ? body : JSON.stringify(body),
		}),
		server,
	);

describe('joining a game', () => {
	const setup = () => {
		const joined = [];
		const game = { addPlayer: (name, units) => (joined.push({ name, units }), { id: 'p1' }), toClient: () => ({}) };

		return { server: { games: { g1: game } }, joined };
	};

	test('a name and a starting party join, and the player is added', async () => {
		const { server, joined } = setup();
		const response = await join(server, 'g1', { playerName: ' Ada ', startingUnits: [{ type: 'worker' }] });

		expect(response.status).toBe(201);
		expect((await response.json()).playerId).toBe('p1');
		expect(joined).toEqual([{ name: 'Ada', units: [{ type: 'worker' }] }]);
	});

	test('a body without a starting party is refused, not thrown on', async () => {
		const { server, joined } = setup();

		for (const body of [
			{ playerName: 'Ada', startingGroup: 'foresters' },
			{ startingUnits: [{ type: 'worker' }] },
			'not json',
		]) {
			expect((await join(server, 'g1', body)).status).toBe(400);
		}

		expect(joined).toEqual([]);
	});

	test('an unknown game is not found', async () => {
		const { server } = setup();

		expect((await join(server, 'nope', { playerName: 'Ada', startingUnits: [{ type: 'worker' }] })).status).toBe(404);
	});
});
