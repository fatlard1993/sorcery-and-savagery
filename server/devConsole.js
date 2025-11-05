import server from './server.js';

const spawnBuild = async () => {
	const buildProcess = Bun.spawn(['bun', 'run', 'build:watch']);

	for await (const chunk of buildProcess.stdout) {
		const line = new TextDecoder().decode(chunk);

		// Output build messages
		process.stdout.write(line);

		// Trigger hot reload on successful build
		if (line === 'build.success\n') {
			server.reloadClients();
		}
	}
};

if (process.env.NODE_ENV === 'development') {
	spawnBuild().catch(error => {
		console.error('[devConsole] Build process error:', error.message);
	});
}
