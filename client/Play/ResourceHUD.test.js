import { afterEach, beforeEach, expect, test } from 'bun:test';
import { screen } from '@testing-library/dom';

import gameContext from '../shared/gameContext.js';
import ResourceHUD from './ResourceHUD.js';

let hud;

beforeEach(() => {
	gameContext.playerId = 'p1';
	gameContext.players.set('p1', {
		id: 'p1',
		resources: { wood: 150, stone: 100, iron: 0, water: 20, food: 40 },
		population: { current: 3, max: 10 },
	});
	hud = new ResourceHUD({ appendTo: container });
});

afterEach(() => {
	hud?.destroy?.();
	hud = null;
});

test("each resource's swatch is named for the resource it stands for", () => {
	for (const name of ['Wood', 'Stone', 'Iron', 'Water', 'Food'])
		expect(screen.getByRole('img', { name })).toBeInTheDocument();
});
