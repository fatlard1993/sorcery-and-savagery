import { Link, styled } from '@vanilla-bean/components';
import { Hub as BaseHub } from '@fatlard1993/web-game-framework/ui/GameRoom';

import { goldHeading } from './shared/ui.js';
import { href, paths } from './paths.js';

export default class Hub extends styled(BaseHub, goldHeading) {
	constructor(options, ...children) {
		super(
			{
				...options,
				toolbar: {
					heading: 'Game Lobby',
					left: [new Link({ textContent: 'Home', href: href(paths.home), variant: 'button', tooltip: false })],
					createText: 'Start a game',
				},
				noGamesMessage: 'No active games. Create one to start a realm.',
				watch: false,
			},
			...children,
		);
	}
}
