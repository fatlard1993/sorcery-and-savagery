import { Router } from '@vanilla-bean/components';
import Home from './Home.js';
import Hub from './Hub.js';
import Create from './Create.js';
import Join from './Join.js';
import StartingGroup from './StartingGroup.js';
import Play from './Play/Play.js';

const paths = {
	home: '/',
	hub: '/hub',
	create: '/create',
	join: '/join/:gameId',
	party: '/party/:gameId',
	play: '/play/:gameId',
};

const views = {
	[paths.home]: Home,
	[paths.hub]: Hub,
	[paths.create]: Create,
	[paths.join]: Join,
	[paths.party]: StartingGroup,
	[paths.play]: Play,
};

export default new Router({ views, defaultPath: paths.home });
