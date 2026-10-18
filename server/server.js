import { homedir } from 'os';
import { join } from 'path';

import Argi from 'argi';

import { Server } from '@fatlard1993/web-game-framework';

import router from './router/index.js';
import Game from './Game.js';

const { options } = new Argi({
	options: {
		database: {
			type: 'string',
			alias: 'd',
			defaultValue: join(homedir(), '.sorcery-and-savagery.json'),
			description: 'Database json file to use',
		},
		port: {
			type: 'number',
			alias: 'p',
			defaultValue: Number(process.env.PORT) || 3040,
		},
	},
});

const server = new Server({
	port: options.port,
	hostname: '0.0.0.0',
	database: options.database,
	Game,
	router,
});

export default server;
