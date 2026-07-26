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

// Install tracked theme overrides after npm restores node_modules and before
// NodeBB compiles the production templates.
require('./render-install-customizations');

// Upgrade the existing 4.2 database before compiling assets. Without this,
// the database retains client-script entries for modules removed in 4.14.
const upgrade = spawnSync(process.execPath, ['nodebb', 'upgrade', '-s'], {
	cwd: __dirname,
	stdio: 'inherit',
	env: process.env,
});
if (upgrade.status !== 0) {
	throw new Error('NodeBB database upgrade failed.');
}

// NodeBB 4.14 expects the default composer to be active before client assets
// are built. Older installations can retain a theme without that active-plugin
// entry, leaving dependent modules (emoji, drafts) unresolved.
const activateComposer = spawnSync(process.execPath, ['nodebb', 'activate', 'nodebb-plugin-composer-default'], {
	cwd: __dirname,
	stdio: 'inherit',
	env: process.env,
});
if (activateComposer.status !== 0) {
	throw new Error('Unable to activate the default composer.');
}

// Plugins installed through the ACP are lost when Render replaces its
// ephemeral filesystem. Keep the requested plugins in package.json and
// activate them during every production build so they survive redeploys.
for (const plugin of [
	'nodebb-plugin-markdown',
	'nodebb-plugin-extended-markdown',
	'@nodebb/nodebb-plugin-user-level',
	'nodebb-plugin-admin-chats',
]) {
	const activation = spawnSync(process.execPath, ['nodebb', 'activate', plugin], {
		cwd: __dirname,
		stdio: 'inherit',
		env: process.env,
	});
	if (activation.status !== 0) {
		throw new Error(`Unable to activate ${plugin}.`);
	}
}

// Run the documented CLI entry point in a fresh process. This ensures plugin
// modules are registered before webpack resolves composer and emoji modules.
const build = spawnSync(process.execPath, ['nodebb', 'build', '--series'], {
	cwd: __dirname,
	stdio: 'inherit',
	env: process.env,
});
if (build.status !== 0) {
	throw new Error('NodeBB asset build failed.');
}
