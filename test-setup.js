/// <reference lib="dom" />

import '@vanilla-bean/components/test-setup.js';

// The framework's client opens its socket on import; the tests' never connects
globalThis.WebSocket = class extends EventTarget {
	readyState = 0;
	close() {}
};
