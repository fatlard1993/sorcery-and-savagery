#!/usr/bin/env bun

import '@fatlard1993/web-game-framework/utils/exit';
import server from './server.js';

await server.ready;

console.log(`🎮 Sorcery & Savagery server running at http://localhost:${server.port}`);
