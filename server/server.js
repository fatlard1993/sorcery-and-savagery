import { homedir } from 'os';
import { join } from 'path';
import { Server } from '@fatlard1993/web-game-framework';
import router from './router/index.js';
import Game from './Game.js';

const server = new Server({
	port: Number(process.env.PORT) || 3040,
	hostname: '0.0.0.0',
	database: join(homedir(), '.sorcery-and-savagery.json'),
	Game,
	router,
});

export default server;
