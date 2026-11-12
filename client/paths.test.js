import { describe, expect, it } from 'bun:test';

import { href, paths } from './paths.js';

describe('href', () => {
	it('links to a path with no params', () => {
		expect(href(paths.hub)).toBe('#/hub');
	});

	it("fills in a path's params", () => {
		expect(href(paths.party, { gameId: 'abc123' })).toBe('#/party/abc123');
	});
});
