import { homedir } from 'os';
import { join } from 'path';
import Server from '../byod-web-game/server/Server.js';
import router from './router/index.js';
import Game from './Game.js';

const server = new Server({
	port: 3040,
	hostname: '0.0.0.0',
	databasePath: join(homedir(), '.sorcery-and-savagery.json'),
	Game,
	router,
});

export default server;
