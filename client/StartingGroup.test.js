import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

// The page enters the game and acts in it through the framework; here, as a game with one player still choosing
const entered = [];
const acted = [];
let players = [{ id: 'p2', choosingParty: true }];
let answer = { ok: true };

mock.module('@fatlard1993/web-game-framework/client', () => ({
	enterGame: async (gameId, { notMember }) => {
		entered.push(gameId);

		const game = { id: gameId, players };

		if (!players.some(({ id }) => id === localStorage.getItem(gameId))) {
			notMember(game);

			return { leave: () => {} };
		}

		return { game, leave: () => {} };
	},
	act: async (name, data) => {
		acted.push({ name, data });

		return answer;
	},
}));

const { default: StartingGroup } = await import('./StartingGroup.js');

describe("the starting party is this tab's player in the game it's for", () => {
	let view;

	beforeEach(() => {
		localStorage.clear();
		window.location.hash = '#/';
		entered.length = 0;
		acted.length = 0;
		players = [{ id: 'p2', choosingParty: true }];
		answer = { ok: true };
	});

	afterEach(() => {
		view?.destroy?.();
		view = null;
	});

	const choose = async () => {
		const more = screen.getByRole('button', { name: 'One more Worker' });

		for (let i = 0; i < 7; i++) await userEvent.click(more);
		await userEvent.click(screen.getByRole('button', { name: 'Begin your conquest' }));
	};

	test('with a player stored for each of two games, the party is chosen in the one in the route, as an action', async () => {
		localStorage.setItem('g1', 'p1');
		localStorage.setItem('g2', 'p2');
		view = new StartingGroup({ gameId: 'g2', appendTo: container });

		await choose();

		await waitFor(() => expect(window.location.hash).toBe('#/play/g2'));
		expect(entered).toEqual(['g2']);
		expect(acted).toEqual([
			{ name: 'chooseStartingParty', data: { startingUnits: Array(7).fill({ type: 'worker' }) } },
		]);
	});

	test('the party is begun only at its full size: the button is disabled through its option until then', async () => {
		localStorage.setItem('g2', 'p2');
		view = new StartingGroup({ gameId: 'g2', appendTo: container });

		const begin = screen.getByRole('button', { name: 'Begin your conquest' });
		const more = screen.getByRole('button', { name: 'One more Worker' });

		expect(begin).toBeDisabled();
		for (let i = 0; i < 7; i++) await userEvent.click(more);
		expect(begin).toBeEnabled();
		expect(view.confirmButton.options.disabled).toBe(false);

		await userEvent.click(screen.getByRole('button', { name: 'One fewer Worker' }));
		expect(begin).toBeDisabled();
		expect(view.confirmButton.options.disabled).toBe(true);
	});

	test('a party the game refuses stays to be chosen again', async () => {
		localStorage.setItem('g2', 'p2');
		answer = { ok: false, error: 'Player not found or party already chosen' };
		view = new StartingGroup({ gameId: 'g2', appendTo: container });

		await choose();

		await waitFor(() => expect(acted).toHaveLength(1));
		expect(window.location.hash).toBe('#/');
	});

	test('a game this tab has no player in goes to its join, whatever another game stored', async () => {
		localStorage.setItem('g1', 'p1');
		view = new StartingGroup({ gameId: 'g3', appendTo: container });

		await waitFor(() => expect(window.location.hash).toBe('#/join/g3'));
		expect(entered).toEqual([]);
	});

	test('a player whose party is chosen goes on to play', async () => {
		localStorage.setItem('g2', 'p2');
		players = [{ id: 'p2' }];
		view = new StartingGroup({ gameId: 'g2', appendTo: container });

		await waitFor(() => expect(window.location.hash).toBe('#/play/g2'));
	});
});
