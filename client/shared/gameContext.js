import { Oxject as Context } from '@vanilla-bean/components';

// Custom Players map with update helper
class Players extends Map {
	update(id, updater = (current) => current) {
		this.set(id, updater(this.get(id)));
	}

	get currentPlayer() {
		return this.get(gameContext.playerId);
	}
}

// Custom Units map
class Units extends Map {
	update(id, updater = (current) => current) {
		this.set(id, updater(this.get(id)));
	}
}

// Custom Buildings map
class Buildings extends Map {
	update(id, updater = (current) => current) {
		this.set(id, updater(this.get(id)));
	}
}

// Game context singleton
const gameContext = new Context({
	// Game ID
	gameId: null,
	playerId: null,

	// Collections
	players: new Players(),
	units: new Units(),
	buildings: new Buildings(),
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
