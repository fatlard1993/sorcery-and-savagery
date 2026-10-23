import gameContext from '../../shared/gameContext.js';

export const onKeyDown = event => {
	// Escape - close menus first, then deselect
	if (event.key === 'Escape' || event.keyCode === 27) {
		// Close radial menu if open
		if (gameContext.activeRadialMenu) {
			gameContext.activeRadialMenu.destroy();
			gameContext.activeRadialMenu = null;
			return; // Don't deselect, just close menu
		}

		// Close building menu if open
		if (gameContext.activeBuildingMenu) {
			gameContext.activeBuildingMenu.destroy();
			gameContext.activeBuildingMenu = null;
			return; // Don't deselect, just close menu
		}

		// Cancel building placement if active
		if (gameContext.placingBuilding) {
			gameContext.placingBuilding = null;
			if (gameContext.buildingGhost) {
				gameContext.buildingGhost.destroy();
				gameContext.buildingGhost = null;
			}
			return; // Don't deselect, just cancel placement
		}

		// If no menus open, deselect all units
		const unitsLayer = gameContext.sceneLayers?.units;
		if (unitsLayer) {
			gameContext.selectedUnits.forEach(unitId => {
				const unit = unitsLayer.list.find(obj => obj.unitId === unitId);
				if (unit && unit.setSelected) {
					unit.setSelected(false);
				}
			});
		}
		gameContext.selectedUnits.clear();
		gameContext.selectedBuilding = null;
	}

	// Control groups (1-9)
	if (event.key >= '1' && event.key <= '9') {
		const groupNum = parseInt(event.key);

		if (event.ctrlKey || event.metaKey) {
			// Save selection to group
			gameContext[`controlGroup${groupNum}`] = new Set(gameContext.selectedUnits);
		} else {
			// Recall group
			const savedGroup = gameContext[`controlGroup${groupNum}`];
			if (savedGroup) {
				// Clear current selection
				gameContext.selectedUnits.forEach(unitId => {
					const unit = gameContext.scene.children.list.find(obj => obj.unitId === unitId);
					if (unit) unit.setSelected(false);
				});
				gameContext.selectedUnits.clear();

				// Select saved group
				savedGroup.forEach(unitId => {
					const unit = gameContext.scene.children.list.find(obj => obj.unitId === unitId);
					if (unit) {
						gameContext.selectedUnits.add(unitId);
						unit.setSelected(true);
					}
				});
			}
		}
	}
};
