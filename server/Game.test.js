import { gridDistance } from '../utils/index.js';
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

		for (const party of [
			[],
			undefined,
			[{ type: 'dragon' }],
			[{ type: 'toString' }],
			['worker'],
			Array(8).fill({ type: 'worker' }),
		]) {
			expect(game.chooseStartingParty(player.id, party).success).toBe(false);
		}

		expect(player.choosingParty).toBe(true);
	});
});

describe('joining', () => {
	let game;

	afterEach(() => game.stopGameLoop());

	test('a player who joins shows as here, and their secret is saved but never shown', () => {
		game = newGame();
		const player = game.addPlayer('Ada');

		expect(game.toClient().players).toEqual([expect.objectContaining({ id: player.id, online: true })]);
		expect(game.toSaveState().secrets[player.id]).toBe(game.secrets.get(player.id));
		expect(JSON.stringify(game.toClient())).not.toContain(game.secrets.get(player.id));
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

describe('winning', () => {
	let game;

	afterEach(() => game.stopGameLoop());

	test('a player still choosing a party or a spot is not defeated, and the one playing does not win by it', () => {
		game = newGame();
		const ada = game.addPlayer('Ada');
		const brann = game.addPlayer('Brann');
		const said = [];

		game.broadcast = update => said.push(update);
		game.chooseStartingParty(ada.id, [{ type: 'worker' }]);
		game.spawnPlayerAtLocation(ada.id, { x: 32, y: 32 });

		for (const choosing of [() => {}, () => game.chooseStartingParty(brann.id, [{ type: 'worker' }])]) {
			choosing();
			game.checkWinConditions();

			expect(said).not.toContain('gameOver');
			expect(said).not.toContain('playerDefeated');
			expect(game.gameLoop).not.toBeNull();
		}
	});

	test('a player left with nothing is defeated once, and the last one standing wins', () => {
		game = newGame();
		const ada = game.addPlayer('Ada');
		const brann = game.addPlayer('Brann');
		const said = [];

		for (const [player, x] of [
			[ada, 20],
			[brann, 44],
		]) {
			game.chooseStartingParty(player.id, [{ type: 'worker' }]);
			game.spawnPlayerAtLocation(player.id, { x, y: 32 });
		}
		game.broadcast = update => said.push(update);
		for (const thing of [...game.units.values(), ...game.buildings.values()])
			if (thing.playerId === brann.id) (game.units.delete(thing.id), game.buildings.delete(thing.id));

		game.checkWinConditions();
		game.checkWinConditions();

		expect(said.filter(update => update === 'playerDefeated')).toHaveLength(1);
		expect(said).toContain('gameOver');
	});
});

describe('deleting', () => {
	test("a deleted game's loop stops", async () => {
		const game = newGame();

		await Bun.sleep(50);
		expect(game.tick).toBeGreaterThan(0);

		game.dispose();
		const at = game.tick;

		await Bun.sleep(50);
		expect(game.tick).toBe(at);
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

describe('actions: a player acts as themselves, and what is malformed is refused', () => {
	let game;

	afterEach(() => game.stopGameLoop());

	// Two players with a party placed on ground that can take a campfire, apart
	const setup = () => {
		game = newGame();
		const ada = game.addPlayer('Ada');
		const brann = game.addPlayer('Brann');
		const spots = game.world.terrain.filter(cell => game.isBuildable(cell));
		const far = spots.find(cell => gridDistance(cell, spots[0]) > 20);

		for (const [player, at] of [
			[ada, spots[0]],
			[brann, far],
		]) {
			expect(
				game.act(player.id, 'chooseStartingParty', { startingUnits: [{ type: 'worker' }, { type: 'worker' }] }),
			).toEqual({ ok: true });
			expect(game.act(player.id, 'spawn', { position: { x: at.x, y: at.y } })).toEqual({ ok: true });
		}

		const unitsOf = player => [...game.units.values()].filter(unit => unit.playerId === player.id);

		return { ada, brann, unitsOf };
	};

	test('the party is chosen once, and a malformed one is refused', () => {
		game = newGame();
		const ada = game.addPlayer('Ada');

		for (const data of [null, 'worker', { startingUnits: 'worker' }, { startingUnits: [{ type: 'dragon' }] }]) {
			expect(game.act(ada.id, 'chooseStartingParty', data).ok).toBe(false);
		}
		expect(game.act(ada.id, 'chooseStartingParty', { startingUnits: [{ type: 'mage' }] })).toEqual({ ok: true });
		expect(game.act(ada.id, 'chooseStartingParty', { startingUnits: [{ type: 'mage' }] }).ok).toBe(false);
		expect(game.act('nobody', 'chooseStartingParty', { startingUnits: [{ type: 'mage' }] })).toEqual({
			ok: false,
			error: 'Not a player in this game',
		});
	});

	test('the campfire goes on open ground on the map, once', () => {
		game = newGame();
		const ada = game.addPlayer('Ada');

		game.act(ada.id, 'chooseStartingParty', { startingUnits: [{ type: 'worker' }] });

		const water = game.world.terrain.find(cell => cell.type === 'water');

		for (const position of [
			undefined,
			{ x: 'a', y: 1 },
			{ x: -1, y: 0 },
			{ x: 1.5, y: 2 },
			...(water ? [water] : []),
		]) {
			expect(game.act(ada.id, 'spawn', { position }).ok).toBe(false);
		}
		expect(game.units.size).toBe(0);
	});

	test("a unit moves along a path it can walk; another player's unit, a jump or junk is refused", () => {
		const { ada, brann, unitsOf } = setup();
		const [unit] = unitsOf(ada);
		const next = [
			{ x: unit.position.x + 1, y: unit.position.y },
			{ x: unit.position.x - 1, y: unit.position.y },
			{ x: unit.position.x, y: unit.position.y + 1 },
			{ x: unit.position.x, y: unit.position.y - 1 },
		].find(cell => game.isWalkable(cell));

		expect(game.act(brann.id, 'move', { moves: [{ unitId: unit.id, path: [next] }] })).toEqual({
			ok: false,
			error: 'Unit not found',
		});
		for (const path of [
			undefined,
			[],
			'north',
			[{ x: unit.position.x + 9, y: unit.position.y }],
			[next, { x: next.x + 5, y: next.y }],
		]) {
			expect(game.act(ada.id, 'move', { moves: [{ unitId: unit.id, path }] }).ok).toBe(false);
		}
		expect(game.act(ada.id, 'move', { moves: 'all' }).ok).toBe(false);
		expect(game.act(ada.id, 'move', { moves: [null] })).toEqual({ ok: false, error: 'Unit not found' });
		expect(unit.path).toBeNull();

		expect(game.act(ada.id, 'move', { moves: [{ unitId: unit.id, path: [next] }] })).toEqual({ ok: true });
		expect(unit.path).toEqual([next]);
		expect(unit.status).toBe('moving');
	});

	test('gathering takes a resource there is, and a forest gives food or wood, nothing else', () => {
		const { ada, unitsOf } = setup();
		const unitIds = unitsOf(ada).map(unit => unit.id);
		const forest = [...game.resources.values()].find(resource => resource.type === 'forest');

		expect(game.act(ada.id, 'task', { unitIds, taskType: 'gather', targetId: 'nope' }).ok).toBe(false);
		expect(game.act(ada.id, 'task', { unitIds, taskType: 'dance', targetId: forest.id }).ok).toBe(false);
		expect(game.act(ada.id, 'task', { unitIds, taskType: 'gather', targetId: forest.id, gatherType: 'gold' }).ok).toBe(
			false,
		);
		expect(game.act(ada.id, 'task', { unitIds, taskType: 'gather', targetId: forest.id, gatherType: 'wood' })).toEqual({
			ok: true,
		});
		expect(unitsOf(ada).map(unit => [unit.status, unit.currentAction.gatherType])).toEqual([
			['gathering', 'wood'],
			['gathering', 'wood'],
		]);
	});

	test('a building site is placed near the campfire and its builders set to work; one that is not a building is refused', () => {
		const { ada, unitsOf } = setup();
		const builders = unitsOf(ada).map(unit => unit.id);
		const [campfire] = [...game.buildings.values()].filter(building => building.playerId === ada.id);
		const site = game.world.terrain.find(
			cell =>
				gridDistance(cell, campfire.position) <= 8 &&
				gridDistance(cell, campfire.position) > 2 &&
				[0, 1].every(dx => [0, 1].every(dy => game.isBuildable({ x: cell.x + dx, y: cell.y + dy }))),
		);

		expect(game.act(ada.id, 'placeBuilding', { buildingType: 'castle', position: site, builders }).ok).toBe(false);
		expect(game.act(ada.id, 'placeBuilding', { buildingType: 'house', position: { x: site.x }, builders }).ok).toBe(
			false,
		);
		expect(
			game.act(ada.id, 'placeBuilding', { buildingType: 'house', position: { x: site.x, y: site.y }, builders }),
		).toEqual({ ok: true });

		const house = [...game.buildings.values()].find(building => building.type === 'house');

		expect(house.playerId).toBe(ada.id);
		expect(unitsOf(ada).map(unit => [unit.status, unit.currentAction.targetId])).toEqual([
			['building', house.id],
			['building', house.id],
		]);
	});

	test("production is queued at the player's own finished building, for a unit it makes", () => {
		const { ada, brann } = setup();
		const [campfire] = [...game.buildings.values()].filter(building => building.playerId === ada.id);

		expect(game.act(ada.id, 'produce', { buildingId: campfire.id, unitType: 'worker' })).toEqual({
			ok: false,
			error: 'That building cannot make that unit',
		});

		const barracks = { ...campfire, id: 'b1', type: 'barracks', productionQueue: [] };

		game.buildings.set(barracks.id, barracks);
		expect(game.act(brann.id, 'produce', { buildingId: 'b1', unitType: 'warrior' }).ok).toBe(false);
		expect(game.act(ada.id, 'produce', { buildingId: 'b1', unitType: 'warrior' })).toEqual({ ok: true });
		expect(barracks.productionQueue).toEqual([{ unitType: 'warrior', progress: 0 }]);
	});

	test("each page sees its own player's resources and party, and no one else's", () => {
		game = newGame();
		const ada = game.addPlayer('Ada');
		const brann = game.addPlayer('Brann');

		game.act(brann.id, 'chooseStartingParty', { startingUnits: [{ type: 'archer' }] });

		const adaSees = Object.fromEntries(game.viewFor(ada.id).players.map(player => [player.id, player]));
		const brannSees = Object.fromEntries(game.viewFor(brann.id).players.map(player => [player.id, player]));

		expect(adaSees[ada.id].resources.wood).toBe(200);
		expect(adaSees[brann.id].resources).toBeUndefined();
		expect(adaSees[brann.id].pendingSpawn).toBe(true);
		expect(brannSees[brann.id].pendingSpawn.startingUnits).toEqual([{ type: 'archer' }]);
		expect(game.toClient().players.every(player => player.resources === undefined)).toBe(true);
		expect(adaSees[ada.id].online).toBe(true);
	});
});
