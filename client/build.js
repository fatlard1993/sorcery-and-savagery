import { watch } from 'fs';

const build = async () => {
	console.log('Building client...');

	const buildResults = await Bun.build({
		target: 'browser',
		entrypoints: ['client/index.html'],
		outdir: 'client/build',
		define: {
			'process.env.NODE_ENV': `"${process.env.NODE_ENV || 'development'}"`,
			'process.cwd': 'String',
			'process.env.AUTOPREFIXER_GRID': '"undefined"',
		},
		minify: process.env.NODE_ENV === 'production',
		sourcemap: process.env.NODE_ENV === 'development' ? 'inline' : 'none',
	});

	if (buildResults.success) {
		console.log('✓ Build successful');
		// Signal to devConsole that build succeeded (triggers hot reload)
		if (process.env.NODE_ENV === 'development') {
			console.log('build.success');
		}
		return 'success';
	} else {
		console.error('✗ Build failed:');
		console.error(buildResults.logs);
		return buildResults.logs;
	}
};

// Watch mode for development
if (process.argv[2] === '--watch') {
	console.log('Watching for changes...');

	const watcher = watch(`${import.meta.dir}/..`, { recursive: true }, (event, filename) => {
		// Ignore build output and hidden files
		if (!/^client\/build|^\.|node_modules/.test(filename)) {
			console.log(`\n${event}: ${filename}`);
			build();
		}
	});

	process.on('SIGINT', () => {
		watcher.close();
		process.exit(0);
	});
}

await build();
