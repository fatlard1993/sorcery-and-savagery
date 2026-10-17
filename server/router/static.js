import { serveStatic } from '@vanilla-bean/components/app';

// The build, then the images the client loads by url from client/assets; a route without an extension is the app
const staticRouter = async request =>
	(await serveStatic(request)) ??
	(await serveStatic(request, { root: 'client' })) ??
	(new URL(request.url).pathname.split('/').pop().includes('.')
		? new Response('File not found', { status: 404 })
		: new Response(Bun.file('client/build/index.html')));

export default staticRouter;
