import { serveApp, serveStatic } from '@vanilla-bean/components/app';

// The page and the build, then the images the client loads by url from client/assets; anything else is a 404
const staticRouter = async request =>
	(await serveApp(request)) ??
	(await serveStatic(request, { root: 'client' })) ??
	new Response('File not found', { status: 404 });

export default staticRouter;
