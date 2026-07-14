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

if (!config.url || !config.secret || !config.mongo.uri) {
	throw new Error('NODEBB_URL, NODEBB_SECRET, and MONGO_URI are required to build NodeBB.');
}

// Render restores its build cache between deploys. Remove the entire generated
// build tree so files compiled by NodeBB 4.2 cannot be reused by NodeBB 4.14.
fs.rmSync(path.join(__dirname, 'build'), { recursive: true, force: true });

fs.writeFileSync(path.join(__dirname, 'config.json'), `${JSON.stringify(config, null, 2)}\n`);
process.argv = [process.execPath, path.join(__dirname, 'nodebb'), 'build'];
require('./src/cli');
