import { Link, styled } from '@vanilla-bean/components';
import { Hub as BaseHub } from '@fatlard1993/web-game-framework/ui/GameRoom';

import { goldHeading } from './shared/ui.js';

// The lobby has no watching view, so a game's Watch link goes
export default class Hub extends styled(
	BaseHub,
	theme => `
		${goldHeading(theme)}

		& a[href^="#/watch/"] {
			display: none;
		}
	`,
) {
	constructor(options, ...children) {
		super(
			{
				...options,
				toolbar: {
					heading: 'Game Lobby',
					left: [new Link({ textContent: 'Home', href: '#/', variant: 'button' })],
					createText: 'New Game',
				},
				noGamesMessage: 'No active games. Create one to start a realm.',
			},
			...children,
		);
	}
}
