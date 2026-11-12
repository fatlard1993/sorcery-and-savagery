import { styled } from '@vanilla-bean/components';
import { Join as BaseJoin } from '@fatlard1993/web-game-framework/ui/GameRoom';

import { fantasyName } from './shared/names.js';
import { goldHeading } from './shared/ui.js';
import { href, paths } from './paths.js';

// Joining names the player; the starting party is chosen next, before play
export default class Join extends styled(BaseJoin, goldHeading) {
	constructor(options, ...children) {
		super(
			{
				formData: { name: localStorage.getItem('lastName') || fantasyName() },
				formInputs: [{ key: 'name', label: 'Your Name', validate: value => (/\S/.test(value) ? null : 'Required') }],
				playUrl: href(paths.party, { gameId: options.gameId }),
				...options,
				toolbar: { heading: 'Join Game', backText: 'Lobby', joinText: 'Join' },
			},
			...children,
		);
	}
}
