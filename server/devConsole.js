import { hotReload } from '@vanilla-bean/components/app';

if (process.env.NODE_ENV === 'development') {
	hotReload.watch().catch(error => {
		console.error('[devConsole] Build error:', error.message);
	});
}
