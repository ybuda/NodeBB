'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

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

// Upgrade the existing 4.2 database before compiling assets. Without this,
// the database retains client-script entries for modules removed in 4.14.
const upgrade = spawnSync(process.execPath, ['nodebb', 'upgrade'], {
	cwd: __dirname,
	stdio: 'inherit',
	env: process.env,
});
if (upgrade.status !== 0) {
	throw new Error('NodeBB database upgrade failed.');
}

// Run the documented CLI entry point in a fresh process. This ensures plugin
// modules are registered before webpack resolves composer and emoji modules.
const build = spawnSync(process.execPath, ['nodebb', 'build'], {
	cwd: __dirname,
	stdio: 'inherit',
	env: process.env,
});
if (build.status !== 0) {
	throw new Error('NodeBB asset build failed.');
}
