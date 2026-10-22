import Game from './Game.js';

const newGame = () => new Game({ name: 'Test', server: { games: {}, socketBroadcast() {} } });

describe('choosing a starting party', () => {
	let game;

	afterEach(() => game.stopGameLoop());

	test('a player joins choosing, and chooses once; each worker adds 15% to the starting resources', () => {
		game = newGame();
		const player = game.addPlayer('Ada');

		expect(player.choosingParty).toBe(true);
		expect(player.pendingSpawn).toBeUndefined();

		const result = game.chooseStartingParty(player.id, [{ type: 'worker' }, { type: 'worker' }, { type: 'warrior' }]);

		expect(result.success).toBe(true);
		expect(player.choosingParty).toBeUndefined();
		expect(player.resources.wood).toBe(260);
		expect(player.pendingSpawn.startingUnits).toEqual([{ type: 'worker' }, { type: 'worker' }, { type: 'warrior' }]);
		expect(game.chooseStartingParty(player.id, [{ type: 'mage' }]).success).toBe(false);
	});

	test('an empty party, or a unit that is not one, is refused', () => {
		game = newGame();
		const player = game.addPlayer('Ada');

		for (const party of [[], undefined, [{ type: 'dragon' }], ['worker']]) {
			expect(game.chooseStartingParty(player.id, party).success).toBe(false);
		}

		expect(player.choosingParty).toBe(true);
	});
});

describe('choosing where to start', () => {
	let game;

	afterEach(() => game.stopGameLoop());

	test('the starting party is placed once, around a campfire at the chosen spot', () => {
		game = newGame();
		const player = game.addPlayer('Ada');

		game.chooseStartingParty(player.id, [{ type: 'worker' }, { type: 'worker' }]);

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

describe('leaving', () => {
	let game;

	afterEach(() => game.stopGameLoop());

	test("a removed player's units and buildings go, and the next tick runs", () => {
		game = newGame();
		const ada = game.addPlayer('Ada');
		const brann = game.addPlayer('Brann');

		for (const [player, x] of [
			[ada, 20],
			[brann, 44],
		]) {
			game.chooseStartingParty(player.id, [{ type: 'worker' }]);
			game.spawnPlayerAtLocation(player.id, { x, y: 32 });
		}

		game.removePlayer(ada.id);

		expect([...game.units.values()].map(unit => unit.playerId)).toEqual([brann.id]);
		expect([...game.buildings.values()].map(building => building.playerId)).toEqual([brann.id]);
		expect(() => game.gameTick(1)).not.toThrow();
	});
});
