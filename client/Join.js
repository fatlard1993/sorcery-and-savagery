import StartingGroup from './StartingGroup.js';
import { getGame } from './api/game.js';

// Joining picks a starting party the same way creating does, then joins the game in the route instead of a new one
export default class Join extends StartingGroup {
	get gameId() {
		return this.options.gameId;
	}

	build() {
		super.build();

		getGame({ gameId: this.gameId }).then(({ response }) => {
			if (!response?.ok) window.location.href = '#/';
		});
	}
}
