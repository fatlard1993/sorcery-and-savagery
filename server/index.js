#!/usr/bin/env bun

import server from './server.js';

await server.ready;

console.log(`🎮 Sorcery & Savagery server running at http://localhost:${server.port}`);
