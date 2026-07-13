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

if (!config.url || !config.mongo.uri) {
	throw new Error('NODEBB_URL and MONGO_URI are required to start NodeBB.');
}

fs.writeFileSync(path.join(__dirname, 'config.json'), `${JSON.stringify(config, null, 2)}\n`);

// Render's build image does not always retain generated NodeBB template views
// in the running image. Compile only the templates on startup if they are
// missing; this is lightweight and avoids a full webpack build at runtime.
const templatesDir = path.join(__dirname, 'build', 'public', 'templates');
const requiredTemplates = ['categories.tpl', 'categories.js', 'header.js', 'footer.js'];
const missingTemplates = () => requiredTemplates.filter(file => !fs.existsSync(path.join(templatesDir, file)));

// The Render free runtime can omit generated views from the build artifact.
// Keep a matching, precompiled set from the local NodeBB installation as a
// fallback so Express always has the views it needs to render the forum.
if (missingTemplates().length) {
	const fallbackTemplates = path.join(__dirname, 'prebuilt', 'templates');
	if (fs.existsSync(fallbackTemplates)) {
		fs.cpSync(fallbackTemplates, templatesDir, { recursive: true });
	}
}

if (missingTemplates().length) {
	const result = spawnSync(process.execPath, ['nodebb', 'build', 'templates', '--series'], {
		cwd: __dirname,
		stdio: 'inherit',
		env: process.env,
	});
	if (result.status !== 0) {
		throw new Error('Unable to compile NodeBB templates at startup.');
	}
}

const stillMissing = missingTemplates();
if (stillMissing.length) {
	throw new Error(`NodeBB template build did not create: ${stillMissing.join(', ')}`);
}

// Keep the loader in the foreground for Render, with logs sent to stdout.
process.argv = [process.execPath, path.join(__dirname, 'loader.js'), '--no-daemon', '--no-silent'];
require('./loader');
