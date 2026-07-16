const staticRouter = async request => {
	let path = decodeURIComponent(new URL(request.url).pathname);

	// Default to index.html for root or routes without extensions
	if (path === '/' || !path.includes('.')) {
		path = '/index.html';
	}

	const possiblePaths = [
		`client/build${path}`,
		`node_modules${path}`,
		`client${path}`,
		path.startsWith('/') ? path.slice(1) : path,
		`../node_modules${path}`,
		`../node_modules/@vanilla-bean/components/node_modules/${path}`,
	];

	let file = null;
	let foundPath = null;

	for (const testPath of possiblePaths) {
		file = Bun.file(testPath);
		if (await file.exists()) {
			foundPath = testPath;
			break;
		}
	}

	if (!foundPath) {
		return new Response(`File not found: ${path}`, { status: 404 });
	}

	// Get proper Content-Type for the file
	const contentType = getContentType(foundPath);

	return new Response(file, {
		headers: {
			'Content-Type': contentType,
			'Cache-Control': 'no-cache, no-store, must-revalidate',
			Pragma: 'no-cache',
			Expires: '0',
			'Access-Control-Allow-Origin': '*',
		},
	});
};

// Helper function to determine content type
/**
 *
 * @param path
 */
function getContentType(path) {
	const ext = path.toLowerCase().split('.').pop();
	const mimeTypes = {
		png: 'image/png',
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		gif: 'image/gif',
		svg: 'image/svg+xml',
		wav: 'audio/wav',
		mp3: 'audio/mpeg',
		js: 'application/javascript',
		css: 'text/css',
		html: 'text/html',
		json: 'application/json',
	};
	return mimeTypes[ext] || 'application/octet-stream';
}
export default staticRouter;
