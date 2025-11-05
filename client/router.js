import { Router } from 'vanilla-bean-components';
import Home from './Home.js';
import StartingGroup from './StartingGroup.js';
import Hub from './Hub.js';
import Join from './Join.js';
import Play from './Play/Play.js';

const paths = {
	home: '/',
	startingGroup: '/starting-group',
	hub: '/hub',
	join: '/join/:gameId',
	play: '/play/:gameId',
};

const views = {
	[paths.home]: Home,
	[paths.startingGroup]: StartingGroup,
	[paths.hub]: Hub,
	[paths.join]: Join,
	[paths.play]: Play,
};

export default new Router({ views, defaultPath: paths.home });
