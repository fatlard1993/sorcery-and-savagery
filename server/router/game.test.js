import gameRouter from './game.js';

const choose = (server, gameId, body) =>
	gameRouter(
		new Request(`http://localhost/games/${gameId}/players/p1/starting-party`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body),
		}),
		server,
	);

describe('choosing a starting party', () => {
	const setup = () => {
		const chosen = [];
		const game = {
			chooseStartingParty: (playerId, units) =>
				units?.length
					? (chosen.push({ playerId, units }), { success: true, player: { id: playerId } })
					: { success: false, error: 'No party' },
		};

		return { server: { games: { g1: game } }, chosen };
	};

	test("the player's party is chosen", async () => {
		const { server, chosen } = setup();
		const response = await choose(server, 'g1', { startingUnits: [{ type: 'worker' }] });

		expect(response.status).toBe(200);
		expect((await response.json()).id).toBe('p1');
		expect(chosen).toEqual([{ playerId: 'p1', units: [{ type: 'worker' }] }]);
	});

	test("a party the game refuses is a 400 with the game's reason", async () => {
		const { server, chosen } = setup();
		const response = await choose(server, 'g1', { startingGroup: 'foresters' });

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: 'No party' });
		expect(chosen).toEqual([]);
	});

	test('an unknown game is not found', async () => {
		const { server } = setup();

		expect((await choose(server, 'nope', { startingUnits: [{ type: 'worker' }] })).status).toBe(404);
	});
});
