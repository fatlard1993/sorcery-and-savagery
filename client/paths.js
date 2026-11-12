/** The game's routes: the router is built from these, and so is every link and redirect */
export const paths = {
	home: '/',
	hub: '/hub',
	create: '/create',
	join: '/join/:gameId',
	party: '/party/:gameId',
	play: '/play/:gameId',
};

/**
 * A hash link to one of the paths, its params filled in
 * @example href(paths.play, { gameId })
 * @param {string} path - One of paths
 * @param {object} [params] - A value for each :param in it
 * @returns {string} The link
 */
export const href = (path, params = {}) => `#${path.replace(/:(\w+)/g, (_, key) => encodeURIComponent(params[key]))}`;
