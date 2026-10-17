#!/usr/bin/env bun

import '@fatlard1993/web-game-framework/utils/exit';
import server from './server.js';
import './devConsole.js';

console.log(`🎮 Sorcery & Savagery server running at http://localhost:${server.port}`);
