import gameContext from '../../shared/gameContext.js';
import Unit from '../GameObjects/Unit.js';

/**
 *
 * @param data
 */
export default function units(data) {
	const unitsLayer = gameContext.sceneLayers.units;

	switch (data.update) {
		case 'unitSpawned': {
			// Create new unit sprite
			new Unit(gameContext.scene, data.unit);

			// Update player resources
			const player = gameContext.players.get(data.unit.playerId);
			if (player) {
				player.population.current += 1;
			}
			break;
		}

		case 'unitMove': {
			// Unit starting to move - update unit data with path
			const unit = gameContext.units.get(data.unitId);
			if (unit && data.path) {
				unit.path = data.path;
				unit.status = 'moving';
			}
			break;
		}

		case 'unitMoved': {
			// Unit reached waypoint - update position and animate
			const unit = gameContext.units.get(data.unitId);
			if (unit && data.position) {
				const oldPosition = { ...unit.position };
				unit.position = data.position;

				const sprite = unitsLayer.list.find(obj => obj.unitId === data.unitId);
				if (sprite) {
					// Calculate distance moved to determine animation duration
					const dx = data.position.x - oldPosition.x;
					const dy = data.position.y - oldPosition.y;
					const distance = Math.sqrt(dx * dx + dy * dy);

					// Match server movement speed: 2.5 tiles/second = 400ms per tile
					const duration = distance * 400;

					sprite.moveTo(data.position, duration);
				}
			}
			break;
		}

		case 'unitAttacked': {
			// Update target health
			const targetMap = data.targetType === 'unit' ? gameContext.units : gameContext.buildings;
			const target = targetMap.get(data.targetId);

			if (target) {
				target.health = data.targetHealth;

				const layer = data.targetType === 'unit' ? unitsLayer : gameContext.sceneLayers.buildings;
				const sprite = layer.list.find(
					obj => (data.targetType === 'unit' ? obj.unitId : obj.buildingId) === data.targetId,
				);
				if (sprite) {
					sprite.updateHealthBar();
				}
			}
			break;
		}

		case 'unitDestroyed': {
			const sprite = unitsLayer.list.find(obj => obj.unitId === data.unitId);
			if (sprite) {
				sprite.destroy();
			}

			gameContext.units.delete(data.unitId);
			gameContext.selectedUnits.delete(data.unitId);
			break;
		}

		case 'unitTaskAssigned': {
			// Update unit status and current action in game context
			const unit = gameContext.units.get(data.unitId);
			if (unit) {
				unit.status = data.status;
				unit.currentAction = data.currentAction;

				// Update gathering progress bar on sprite
				const sprite = unitsLayer.list.find(obj => obj.unitId === data.unitId);
				if (sprite && sprite.updateGatherProgress) {
					sprite.updateGatherProgress();
				}
			}
			break;
		}

		case 'unitGatherProgress': {
			// Update gathering progress bar
			const unit = gameContext.units.get(data.unitId);
			if (unit && unit.currentAction) {
				unit.currentAction.carrying = data.carrying;

				const sprite = unitsLayer.list.find(obj => obj.unitId === data.unitId);
				if (sprite && sprite.updateGatherProgress) {
					sprite.updateGatherProgress();
				}
			}
			break;
		}
	}
}
