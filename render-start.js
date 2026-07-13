'use strict';

const fs = require('fs');
const path = require('path');

const config = {
	url: process.env.NODEBB_URL,
	secret: process.env.NODEBB_SECRET,
	database: 'mongo',
	mongo: {
		uri: process.env.MONGO_URI || process.env.MONGODB_URI,
	},
};

if (!config.url || !config.mongo.uri) {
	throw new Error('NODEBB_URL and MONGO_URI are required to start NodeBB.');
}

fs.writeFileSync(path.join(__dirname, 'config.json'), `${JSON.stringify(config, null, 2)}\n`);

// Keep the loader in the foreground for Render, with logs sent to stdout.
process.argv = [process.execPath, path.join(__dirname, 'loader.js'), '--no-daemon', '--no-silent'];
require('./loader');
