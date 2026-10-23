import gameContext from '../../shared/gameContext.js';

/**
 *
 * @param data
 */
export default function players(data) {
	switch (data.update) {
		case 'addPlayer': {
			gameContext.players.set(data.newPlayer.id, data.newPlayer);
			break;
		}

		case 'removePlayer': {
			gameContext.players.delete(data.id);
			break;
		}

		case 'playerJoined': {
			gameContext.players.set(data.player.id, data.player);
			break;
		}

		case 'playerResourcesUpdated': {
			const player = gameContext.players.get(data.playerId);
			if (player) {
				player.resources = data.resources;
			}
			break;
		}
	}
}
