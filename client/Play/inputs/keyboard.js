import gameContext from '../../shared/gameContext.js';

export const onKeyDown = (event) => {
	// Escape - deselect all
	if (event.key === 'Escape') {
		gameContext.selectedUnits.forEach((unitId) => {
			const unit = gameContext.scene.children.list.find((obj) => obj.unitId === unitId);
			if (unit) unit.setSelected(false);
		});
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
				gameContext.selectedUnits.forEach((unitId) => {
					const unit = gameContext.scene.children.list.find((obj) => obj.unitId === unitId);
					if (unit) unit.setSelected(false);
				});
				gameContext.selectedUnits.clear();

				// Select saved group
				savedGroup.forEach((unitId) => {
					const unit = gameContext.scene.children.list.find((obj) => obj.unitId === unitId);
					if (unit) {
						gameContext.selectedUnits.add(unitId);
						unit.setSelected(true);
					}
				});
			}
		}
	}
};
