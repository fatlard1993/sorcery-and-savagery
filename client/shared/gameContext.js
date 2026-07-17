import gameContext from '@fatlard1993/web-game-framework/client/gameContext';

// The framework context provides gameId, playerId, and players (with currentPlayer);
// extend it with this game's state
Object.assign(gameContext, {
	// Collections
	units: new Map(),
	buildings: new Map(),
	resources: new Map(),

	// Phaser references
	game: null,
	scene: null,
	sceneLayers: null,

	// Selection state
	selectedUnits: new Set(),
	selectedBuilding: null,
	selectionStart: null,
	selectionRect: null,
	isSelecting: false,

	// UI state
	openDialog: null,

	// Server state (initial load)
	serverState: null,
});

export default gameContext;
