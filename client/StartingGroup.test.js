import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import StartingGroup from './StartingGroup.js';

const json = body => new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });

describe("the starting party is this tab's player in the game it's for", () => {
	let view;
	let fetchSpy;

	beforeEach(() => {
		localStorage.clear();
		window.location.hash = '#/';
		fetchSpy = spyOn(globalThis, 'fetch').mockImplementation(async (url, { method } = {}) =>
			method === 'POST' ? json({ id: 'p2' }) : json({ id: 'g2', players: [{ id: 'p2', choosingParty: true }] }),
		);
	});

	afterEach(() => {
		fetchSpy.mockRestore();
		view?.destroy?.();
		view = null;
	});

	test('with a player stored for each of two games, the party is chosen for the one in the route', async () => {
		localStorage.setItem('g1', 'p1');
		localStorage.setItem('g2', 'p2');
		view = new StartingGroup({ gameId: 'g2', appendTo: container });

		const more = screen.getByRole('button', { name: 'One more Worker' });
		for (let i = 0; i < 7; i++) await userEvent.click(more);
		await userEvent.click(screen.getByRole('button', { name: 'Begin Your Conquest' }));

		await waitFor(() => expect(window.location.hash).toBe('#/play/g2'));
		const [url, { body }] = fetchSpy.mock.calls.find(([, options]) => options?.method === 'POST');
		expect(url).toEndWith('/games/g2/players/p2/starting-party');
		expect(JSON.parse(body).startingUnits).toHaveLength(7);
	});

	test('a game this tab has no player in goes to its join, whatever another game stored', async () => {
		localStorage.setItem('g1', 'p1');
		view = new StartingGroup({ gameId: 'g3', appendTo: container });

		await waitFor(() => expect(window.location.hash).toBe('#/join/g3'));
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	test('a player whose party is chosen goes on to play', async () => {
		localStorage.setItem('g2', 'p2');
		fetchSpy.mockImplementation(async () => json({ id: 'g2', players: [{ id: 'p2' }] }));
		view = new StartingGroup({ gameId: 'g2', appendTo: container });

		await waitFor(() => expect(window.location.hash).toBe('#/play/g2'));
	});
});
