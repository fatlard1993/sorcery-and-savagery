import Join from './Join.js';
import StartingGroup from './StartingGroup.js';
import BuildingMenu from './Play/BuildingMenu.js';

// VBC 2 routes undeclared option keys onto the elem with a dev warning;
// these cover each view's static schema declarations
describe('view option schemas', () => {
	let view;

	afterEach(() => {
		view?.destroy?.();
		view = null;
	});

	test('Join routes gameId to the component, not the elem', () => {
		view = new Join({ gameId: 'abc12', autoRender: false });

		expect(view.gameId).toBe('abc12');
		expect(view.options.gameId).toBe('abc12');
		expect(view.elem.gameId).toBeUndefined();
	});

	test('BuildingMenu routes onSelect to the component, not the elem', () => {
		const onSelect = () => {};
		view = new BuildingMenu({ onSelect, autoRender: false });

		expect(view.onSelect).toBe(onSelect);
		expect(view.elem.onSelect).toBeUndefined();
	});

	test('StartingGroup generates a default playerName and seeds the name input with it', () => {
		view = new StartingGroup({ appendTo: container });

		expect(view.options.playerName.length).toBeGreaterThan(0);
		expect(container.querySelector('input').value).toBe(view.options.playerName);
	});

	test('StartingGroup keeps a provided playerName', () => {
		view = new StartingGroup({ playerName: 'Tester', autoRender: false });

		expect(view.options.playerName).toBe('Tester');
	});
});

describe('gameContext', () => {
	test('extends the framework context with game state and currentPlayer', async () => {
		const { default: gameContext } = await import('./shared/gameContext.js');

		gameContext.playerId = 'p1';
		gameContext.players.set('p1', { id: 'p1', name: 'Tester' });

		expect(gameContext.players.currentPlayer.name).toBe('Tester');
		expect(gameContext.units).toBeInstanceOf(Map);
		expect(gameContext.buildings).toBeInstanceOf(Map);
		expect(gameContext.selectedUnits).toBeInstanceOf(Set);
	});
});
