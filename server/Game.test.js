import Game from './Game.js';

describe('choosing where to start', () => {
	let game;

	afterEach(() => game.stopGameLoop());

	test('the starting party is placed once, around a campfire at the chosen spot', () => {
		game = new Game({ name: 'Test', server: { games: {}, socketBroadcast() {} } });
		const player = game.addPlayer('Ada', [{ type: 'worker' }, { type: 'worker' }]);

		expect(game.units.size).toBe(0);

		const result = game.spawnPlayerAtLocation(player.id, { x: 32, y: 32 });

		expect(result).toEqual({ success: true, player });
		expect(player.pendingSpawn).toBeUndefined();
		expect([...game.units.values()].map(unit => [unit.type, unit.playerId])).toEqual([
			['worker', player.id],
			['worker', player.id],
		]);
		expect([...game.buildings.values()].map(building => building.type)).toEqual(['campfire']);

		expect(game.spawnPlayerAtLocation(player.id, { x: 10, y: 10 }).success).toBe(false);
		expect(game.units.size).toBe(2);
	});
});
