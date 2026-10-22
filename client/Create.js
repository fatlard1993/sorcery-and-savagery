import { styled } from '@vanilla-bean/components';
import { Create as BaseCreate } from '@fatlard1993/web-game-framework/ui/GameRoom';

import { fantasyName } from './shared/names.js';
import { goldHeading } from './shared/ui.js';

export default class Create extends styled(BaseCreate, goldHeading) {
	constructor(options, ...children) {
		super(
			{
				formData: { name: `${fantasyName()}'s Realm` },
				formInputs: [{ key: 'name', label: 'Realm Name', validations: [[/\S/, 'Required']] }],
				...options,
				toolbar: { heading: 'New Game', backText: 'Lobby', createText: 'Create' },
			},
			...children,
		);
	}
}
