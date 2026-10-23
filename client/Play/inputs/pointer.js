import { throttle } from '@vanilla-bean/components';
import { pxToGridPosition, gridToPxPosition, findPath } from '../../../utils/index.js';
import { moveUnit, assignTask, placeBuilding } from '../../api/game.js';
import gameContext from '../../shared/gameContext.js';
import RadialMenu from '../RadialMenu.js';
import BuildingMenu from '../BuildingMenu.js';
import { BUILDINGS } from '../../../constants/index.js';

export const onPointerDown = pointer => {
	// Ignore if a menu button is being clicked
	if (gameContext.menuButtonClicked) {
		return;
	}

	// Left-click handling
	const worldPoint = gameContext.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);

	// Check if clicked on a unit (search in units layer)
	const unitsLayer = gameContext.sceneLayers.units;

	const clickedUnit = unitsLayer.list.find(obj => {
		if (!obj.unitId) return false;

		const bounds = obj.getBounds();
		return bounds.contains(worldPoint.x, worldPoint.y);
	});

	if (clickedUnit) {
		// Set flag to prevent action menu from opening on unit selection
		gameContext.justSelectedUnit = true;

		const isAlreadySelected = gameContext.selectedUnits.has(clickedUnit.unitId);
		const shiftHeld = gameContext.scene.input.keyboard.addKey('SHIFT').isDown;

		if (shiftHeld) {
			// Shift-clicking: toggle selection without clearing others
			if (isAlreadySelected) {
				gameContext.selectedUnits.delete(clickedUnit.unitId);
				clickedUnit.setSelected(false);
			} else {
				gameContext.selectedUnits.add(clickedUnit.unitId);
				clickedUnit.setSelected(true);
			}
		} else {
			// Normal click
			if (isAlreadySelected) {
				// Clicking a selected unit - deselect it
				gameContext.selectedUnits.delete(clickedUnit.unitId);
				clickedUnit.setSelected(false);
			} else {
				// Clicking an unselected unit - clear others and select this one
				gameContext.selectedUnits.forEach(unitId => {
					const unit = unitsLayer.list.find(obj => obj.unitId === unitId);
					if (unit) unit.setSelected(false);
				});
				gameContext.selectedUnits.clear();
				gameContext.selectedUnits.add(clickedUnit.unitId);
				clickedUnit.setSelected(true);
			}
		}
		return;
	}

	// Check if clicked on building (search in buildings layer)
	const buildingsLayer = gameContext.sceneLayers.buildings;
	const clickedBuilding = buildingsLayer.list.find(
		obj => obj.buildingId && obj.getBounds().contains(worldPoint.x, worldPoint.y),
	);

	if (clickedBuilding) {
		// Select building (for production UI)
		gameContext.selectedBuilding = clickedBuilding.buildingId;
		return;
	}

	// Clicked on empty ground - start selection rectangle
	// Don't clear selection yet - wait for onPointerUp to decide if it's a move or box select
	gameContext.isSelecting = true;
	gameContext.selectionStart = { x: worldPoint.x, y: worldPoint.y };
	gameContext.selectionRect.setPosition(worldPoint.x, worldPoint.y);
	gameContext.selectionRect.setSize(0, 0);
	gameContext.selectionRect.setVisible(true);
};

export const onPointerMove = throttle(pointer => {
	const worldPoint = gameContext.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);

	// Handle building placement ghost
	if (gameContext.placingBuilding && gameContext.buildingGhost) {
		const gridPos = pxToGridPosition({ x: worldPoint.x, y: worldPoint.y });

		// Use same positioning logic as Building.js (gridToPxPosition)
		const pos = gridToPxPosition(gridPos);
		gameContext.buildingGhost.setPosition(pos.x, pos.y);

		// Check if placement is valid (all tiles buildable and no overlaps)
		const buildingData = BUILDINGS[gameContext.placingBuilding.type];
		let isValid = true;

		// Check all tiles the building would occupy
		for (let bx = 0; bx < buildingData.size.width && isValid; bx++) {
			for (let by = 0; by < buildingData.size.height && isValid; by++) {
				const checkPos = { x: gridPos.x + bx, y: gridPos.y + by };

				// Check if position exists
				const terrain = gameContext.serverState.world.terrain.find(t => t.x === checkPos.x && t.y === checkPos.y);
				if (!terrain) {
					isValid = false;
					break;
				}

				// Check if terrain is buildable (not water)
				if (terrain.type === 'water') {
					isValid = false;
					break;
				}

				// Check for existing buildings
				for (const building of gameContext.buildings.values()) {
					const buildingStats = BUILDINGS[building.type];
					for (let obx = 0; obx < buildingStats.size.width; obx++) {
						for (let oby = 0; oby < buildingStats.size.height; oby++) {
							if (building.position.x + obx === checkPos.x && building.position.y + oby === checkPos.y) {
								isValid = false;
								break;
							}
						}
					}
				}

				// Check for resources
				for (const resource of gameContext.serverState.world.resources) {
					const size = resource.size || { width: 1, height: 1 };
					for (let rx = 0; rx < size.width; rx++) {
						for (let ry = 0; ry < size.height; ry++) {
							if (resource.position.x + rx === checkPos.x && resource.position.y + ry === checkPos.y) {
								isValid = false;
								break;
							}
						}
					}
				}
			}
		}

		// Check proximity requirement (except for campfires)
		if (gameContext.placingBuilding.type !== 'campfire' && isValid) {
			const completedBuildings = Array.from(gameContext.buildings.values()).filter(
				b => b.playerId === gameContext.playerId && b.constructionProgress >= 1.0,
			);

			if (completedBuildings.length === 0) {
				isValid = false; // No buildings yet, must build campfire first
			} else {
				// Check if within 10 tiles of any building
				let nearAnyBuilding = false;
				for (const building of completedBuildings) {
					const dx = Math.abs(gridPos.x - building.position.x);
					const dy = Math.abs(gridPos.y - building.position.y);
					const distance = Math.max(dx, dy); // Chebyshev distance
					if (distance <= 10) {
						nearAnyBuilding = true;
						break;
					}
				}
				if (!nearAnyBuilding) {
					isValid = false;
				}
			}
		}

		// Update ghost color based on validity
		const color = isValid ? 0x00ff00 : 0xff0000;
		gameContext.buildingGhost.setFillStyle(color, 0.3);
		gameContext.buildingGhost.setStrokeStyle(2, color);
	}

	// Handle selection rectangle
	if (gameContext.isSelecting) {
		const start = gameContext.selectionStart;
		const width = worldPoint.x - start.x;
		const height = worldPoint.y - start.y;
		gameContext.selectionRect.setSize(width, height);
	}
}, 16);

export const onPointerUp = async pointer => {
	// Ignore if a menu button was just clicked
	if (gameContext.menuButtonClicked) {
		return;
	}

	const worldPoint = gameContext.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
	const gridPos = pxToGridPosition({ x: worldPoint.x, y: worldPoint.y });

	// Handle selection rectangle completion
	if (gameContext.isSelecting) {
		gameContext.isSelecting = false;
		gameContext.selectionRect.setVisible(false);

		// Check if this was a tiny rectangle (just a click) vs actual drag
		const bounds = gameContext.selectionRect.getBounds();
		const wasDrag = Math.abs(bounds.width) > 5 || Math.abs(bounds.height) > 5;

		if (wasDrag) {
			// Box select units
			const unitsLayer = gameContext.sceneLayers.units;

			if (!gameContext.scene.input.keyboard.addKey('SHIFT').isDown) {
				// Clear previous selection before box selecting
				gameContext.selectedUnits.forEach(unitId => {
					const unit = unitsLayer.list.find(obj => obj.unitId === unitId);
					if (unit) unit.setSelected(false);
				});
				gameContext.selectedUnits.clear();
			}

			unitsLayer.list.forEach(obj => {
				if (obj.unitId && obj.unitData.playerId === gameContext.playerId) {
					const objBounds = obj.getBounds();
					// Check if unit bounds overlap with selection bounds (not just center point)
					const overlaps = !(
						objBounds.right < bounds.left ||
						objBounds.left > bounds.right ||
						objBounds.bottom < bounds.top ||
						objBounds.top > bounds.bottom
					);
					if (overlaps) {
						gameContext.selectedUnits.add(obj.unitId);
						obj.setSelected(true);
					}
				}
			});

			return;
		}
		// Else: was just a click (not a drag)
		// If no units selected, clear selection now
		if (!gameContext.scene.input.keyboard.addKey('SHIFT').isDown && gameContext.selectedUnits.size === 0) {
			// Was a simple click with nothing selected - do nothing
			return;
		}
		// Else: fall through to move command
	}

	// Close existing radial menu if open
	if (gameContext.activeRadialMenu) {
		gameContext.activeRadialMenu.destroy();
		gameContext.activeRadialMenu = null;
		return; // Don't process this click further
	}

	// Handle building placement mode
	if (gameContext.placingBuilding) {
		try {
			const result = await placeBuilding({
				buildingType: gameContext.placingBuilding.type,
				position: gridPos,
			});

			// Auto-assign selected units to construction
			if (gameContext.selectedUnits.size > 0) {
				for (const unitId of gameContext.selectedUnits) {
					try {
						await assignTask({
							unitId,
							taskType: 'build',
							targetId: result.body.buildingId,
						});
					} catch (err) {
						console.error('Failed to assign unit to build:', err);
					}
				}
			}
		} catch (err) {
			console.error('Failed to place building:', err);
		}

		// Exit placement mode and destroy ghost
		gameContext.placingBuilding = null;
		if (gameContext.buildingGhost) {
			gameContext.buildingGhost.destroy();
			gameContext.buildingGhost = null;
		}
		return;
	}

	// Don't open action menu if we just selected a unit
	if (gameContext.justSelectedUnit) {
		gameContext.justSelectedUnit = false;
		return;
	}

	// Check if clicked on something that has multiple actions
	if (gameContext.selectedUnits.size > 0) {
		const availableActions = [];

		// Check if clicked on a resource
		const resourcesLayer = gameContext.sceneLayers.resources;
		const clickedResource = resourcesLayer.list.find(
			obj => obj.resourceId && obj.getBounds().contains(worldPoint.x, worldPoint.y),
		);

		if (clickedResource) {
			// Check if it's a forest (offers dual gather)
			const resourceData = gameContext.resources.get(clickedResource.resourceId);
			const isForest = resourceData?.type === 'forest';

			if (isForest) {
				// Forests offer two gathering options
				availableActions.push({
					label: 'Food',
					onSelect: () => {
						gameContext.selectedUnits.forEach(async unitId => {
							try {
								await assignTask({
									unitId,
									taskType: 'gather',
									targetId: clickedResource.resourceId,
									gatherType: 'food',
								});
							} catch (err) {
								console.error(`Failed to assign gather food task:`, err);
							}
						});
					},
				});

				availableActions.push({
					label: 'Wood',
					onSelect: () => {
						gameContext.selectedUnits.forEach(async unitId => {
							try {
								await assignTask({
									unitId,
									taskType: 'gather',
									targetId: clickedResource.resourceId,
									gatherType: 'wood',
								});
							} catch (err) {
								console.error(`Failed to assign chop wood task:`, err);
							}
						});
					},
				});
			} else {
				// Other resources have single gather option
				availableActions.push({
					label: 'Gather',
					onSelect: () => {
						gameContext.selectedUnits.forEach(async unitId => {
							try {
								await assignTask({
									unitId,
									taskType: 'gather',
									targetId: clickedResource.resourceId,
								});
							} catch (err) {
								console.error(`Failed to assign gather task:`, err);
							}
						});
					},
				});
			}
		}

		// Check if clicked on a building
		const buildingsLayer = gameContext.sceneLayers.buildings;
		const clickedBuilding = buildingsLayer.list.find(
			obj => obj.buildingId && obj.getBounds().contains(worldPoint.x, worldPoint.y),
		);

		if (clickedBuilding) {
			const building = gameContext.buildings.get(clickedBuilding.buildingId);
			// Only show build option if building is under construction
			if (building && building.constructionProgress < 1.0) {
				availableActions.push({
					label: 'Build',
					onSelect: () => {
						gameContext.selectedUnits.forEach(async unitId => {
							try {
								await assignTask({
									unitId,
									taskType: 'build',
									targetId: clickedBuilding.buildingId,
								});
							} catch (err) {
								console.error(`Failed to assign build task:`, err);
							}
						});
					},
				});
			}
		}

		// Add Build option if clicking on empty ground
		if (!clickedResource && !clickedBuilding) {
			availableActions.push({
				label: 'Build',
				onSelect: () => {
					// Open building selection menu
					gameContext.activeBuildingMenu = new BuildingMenu({
						appendTo: document.body,
						onSelect: async buildingType => {
							// Enter building placement mode
							gameContext.placingBuilding = {
								type: buildingType,
								position: gridPos,
							};

							// Create placement ghost
							const buildingData = BUILDINGS[buildingType];
							const size = buildingData.size;
							const tileSize = 32;

							gameContext.buildingGhost = gameContext.scene.add.rectangle(
								0,
								0,
								size.width * tileSize,
								size.height * tileSize,
								0x00ff00,
								0.3,
							);
							gameContext.buildingGhost.setStrokeStyle(2, 0x00ff00);
							gameContext.buildingGhost.setDepth(999);
						},
					});
				},
			});
		}

		// Always include Move as an option
		availableActions.push({
			label: 'Move',
			onSelect: () => {
				executeMove(gridPos);
			},
		});

		// Show radial menu if multiple actions available
		if (availableActions.length > 1) {
			gameContext.activeRadialMenu = new RadialMenu(gameContext.scene, worldPoint.x, worldPoint.y, availableActions);
			return;
		}

		// If only one action (Move), execute it directly
		executeMove(gridPos);
	}
};

// Extract move logic into a helper function
/**
 *
 * @param gridPos
 */
async function executeMove(gridPos) {
	// Spread units around destination in a formation
	const units = Array.from(gameContext.selectedUnits);
	const formationOffsets = [
		{ x: 0, y: 0 },
		{ x: -1, y: 0 },
		{ x: 1, y: 0 },
		{ x: 0, y: -1 },
		{ x: 0, y: 1 },
		{ x: -1, y: -1 },
		{ x: 1, y: -1 },
		{ x: -1, y: 1 },
		{ x: 1, y: 1 },
	];

	// Move all selected units
	for (let i = 0; i < units.length; i++) {
		const unitId = units[i];
		const unit = gameContext.units.get(unitId);

		if (unit && unit.playerId === gameContext.playerId) {
			// Apply formation offset
			const offset = formationOffsets[i % formationOffsets.length];
			const destination = {
				x: gridPos.x + offset.x,
				y: gridPos.y + offset.y,
			};

			// Calculate path from unit's current position
			const path = findPath(unit.position, destination, pos => {
				// Check if position is on walkable terrain
				const terrain = gameContext.serverState.world.terrain.find(t => t.x === pos.x && t.y === pos.y);
				if (!terrain) return false;

				// Check terrain type walkability (blocks water)
				const terrainType = terrain.type;
				if (terrainType === 'water') return false;

				// Check for water/stone resources (check all tiles they occupy)
				for (const resource of gameContext.serverState.world.resources) {
					if (resource.resourceType === 'water' || resource.resourceType === 'stone') {
						const size = resource.size || { width: 1, height: 1 };
						for (let rx = 0; rx < size.width; rx++) {
							for (let ry = 0; ry < size.height; ry++) {
								if (resource.position.x + rx === pos.x && resource.position.y + ry === pos.y) {
									return false;
								}
							}
						}
					}
				}

				// Check for buildings
				for (const building of gameContext.buildings.values()) {
					const buildingData = BUILDINGS[building.type];
					if (!buildingData) continue;

					// Check if position overlaps building
					for (let bx = 0; bx < buildingData.size.width; bx++) {
						for (let by = 0; by < buildingData.size.height; by++) {
							if (building.position.x + bx === pos.x && building.position.y + by === pos.y) {
								return false;
							}
						}
					}
				}

				return true;
			});

			if (path.length > 0) {
				// Send move command to server
				try {
					await moveUnit({ unitId, path });
				} catch (err) {
					console.error('Move command error for', unitId, ':', err);
				}
			}
		}
	}
}
