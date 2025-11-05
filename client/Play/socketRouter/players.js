import gameContext from '../../shared/gameContext.js';

/**
 *
 * @param data
 */
export default function players(data) {
	switch (data.update) {
		case 'playerJoined': {
			gameContext.players.set(data.player.id, data.player);
			console.log(`Player joined: ${data.player.name}`);
			break;
		}

		case 'playerResourcesUpdated': {
			const player = gameContext.players.get(data.playerId);
			if (player) {
				player.resources = data.resources;
			}
			break;
		}

		case 'playerDefeated': {
			const player = gameContext.players.get(data.playerId);
			if (player) {
				console.log(`Player defeated: ${player.name}`);
			}
			break;
		}
	}
}
