import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

import gameContext from '../shared/gameContext.js';
import BuildingMenu from './BuildingMenu.js';

// A player who can afford a House (100 wood, 50 stone) but not a Barracks (200 wood, 150 stone)
describe('a building the player can afford is pressed; one they cannot is disabled, and says so', () => {
	let menu;
	let selected;

	beforeEach(() => {
		selected = [];
		gameContext.playerId = 'p1';
		gameContext.players.set('p1', {
			id: 'p1',
			techTree: { unlocked: ['house', 'barracks'] },
			resources: { wood: 150, stone: 100, iron: 0, food: 0 },
		});
		menu = new BuildingMenu({ appendTo: container, onSelect: type => selected.push(type) });
	});

	afterEach(() => {
		menu?.destroy?.();
		menu = null;
	});

	// The menu opens itself a moment after it's made
	const card = name => screen.findByRole('button', { name: new RegExp(`^${name}`) });

	test('the unaffordable card is aria-disabled, and neither a click nor Enter selects it', async () => {
		const barracks = await card('Barracks');

		expect(barracks).toHaveAttribute('aria-disabled', 'true');

		await userEvent.click(barracks);
		barracks.focus();
		await userEvent.keyboard('{Enter}');

		expect(selected).toEqual([]);
	});

	test('the affordable card is not disabled, and a click selects it', async () => {
		const house = await card('House');

		expect(house).not.toHaveAttribute('aria-disabled');

		await userEvent.click(house);

		expect(selected).toEqual(['house']);
	});

	test('the affordable card is reached by keyboard, and Enter selects it', async () => {
		const house = await card('House');

		house.focus();
		await userEvent.keyboard('{Enter}');

		expect(selected).toEqual(['house']);
	});
});
