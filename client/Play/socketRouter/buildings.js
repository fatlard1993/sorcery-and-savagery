import gameContext from '../../shared/gameContext.js';
import Building from '../GameObjects/Building.js';

/**
 *
 * @param data
 */
export default function buildings(data) {
	const buildingsLayer = gameContext.sceneLayers.buildings;

	switch (data.update) {
		case 'buildingPlaced': {
			// Create new building sprite
			new Building(gameContext.scene, data.building);
			break;
		}

		case 'buildingConstructionProgress': {
			const sprite = buildingsLayer.list.find(obj => obj.buildingId === data.buildingId);
			if (sprite) {
				sprite.updateConstruction(data.progress);
			}
			break;
		}

		case 'buildingCompleted': {
			const sprite = buildingsLayer.list.find(obj => obj.buildingId === data.buildingId);
			if (sprite) {
				sprite.updateConstruction(1.0);
			}
			break;
		}

		case 'buildingDestroyed': {
			const sprite = buildingsLayer.list.find(obj => obj.buildingId === data.buildingId);
			if (sprite) {
				sprite.destroy();
			}

			gameContext.buildings.delete(data.buildingId);
			break;
		}

		case 'productionQueueUpdated': {
			const building = gameContext.buildings.get(data.buildingId);
			if (building) {
				building.productionQueue = data.queue;
			}
			break;
		}

		case 'unitProduced': {
			// Unit spawning handled by unitSpawned event
			break;
		}
	}
}
