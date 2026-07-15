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

// Keep the tracked template overrides available if Render restores an image
// whose generated template directory needs to be rebuilt on startup.
require('./render-install-customizations');

// The original install was interrupted after the user was created, leaving a
// legacy permissions state that hides NodeBB's local-login form. This only
// enables rendering the form; authentication still goes through NodeBB's
// normal password validation.
process.env.NODEBB_RENDER_LOCAL_LOGIN = 'true';

// A generated config.json bypasses NodeBB's web installer. On a fresh
// database, use the administrator values stored as Render secrets to perform
// the otherwise-missed initial setup.
const adminEnvKeys = ['NODEBB_ADMIN_USERNAME', 'NODEBB_ADMIN_EMAIL', 'NODEBB_ADMIN_PASSWORD'];
const missingAdminEnvKeys = adminEnvKeys.filter(key => !process.env[key]);
if (missingAdminEnvKeys.length && missingAdminEnvKeys.length !== adminEnvKeys.length) {
	throw new Error(`Missing required NodeBB administrator variables: ${missingAdminEnvKeys.join(', ')}`);
}

// The forum account exists already, so ensure it retains its administrator
// membership on every start even if Render's bootstrap-only variables were
// removed after the initial installation.
const existingAdmin = spawnSync(process.execPath, ['render-promote-admin.js'], {
	cwd: __dirname,
	stdio: 'inherit',
	env: process.env,
});
if (existingAdmin.status !== 0 && existingAdmin.status !== 2) {
	throw new Error('Unable to verify the NodeBB administrator.');
}

if (!missingAdminEnvKeys.length) {
	// Do not run the full installer on every Render restart. On an existing
	// database it needlessly rebuilds configuration and makes cold starts take
	// much longer. The helper exits with code 2 only when no admin user exists.
	if (existingAdmin.status === 2) {
		const setup = {
			'admin:username': process.env.NODEBB_ADMIN_USERNAME,
			'admin:email': process.env.NODEBB_ADMIN_EMAIL,
			'admin:password': process.env.NODEBB_ADMIN_PASSWORD,
		};
		const runSetup = () => spawnSync(process.execPath, ['nodebb', 'setup', JSON.stringify(setup), '--skip-build'], {
			cwd: __dirname,
			stdio: 'inherit',
			env: process.env,
		});

		let result = runSetup();
		if (result.status !== 0) {
			// Registration can create the first user before setup runs. In that case,
			// NodeBB rejects the duplicate email; promote that existing user and retry
			// setup instead of leaving the forum half-installed.
			const promotion = spawnSync(process.execPath, ['render-promote-admin.js'], {
				cwd: __dirname,
				stdio: 'inherit',
				env: process.env,
			});
			if (promotion.status === 0) {
				result = runSetup();
			}
		}
		if (result.status !== 0) {
			throw new Error('NodeBB initial setup failed.');
		}
	}
}

const contactNavigation = spawnSync(process.execPath, ['render-ensure-navigation.js'], {
	cwd: __dirname,
	stdio: 'inherit',
	env: process.env,
});
if (contactNavigation.status !== 0) {
	throw new Error('Unable to configure the contact navigation item.');
}

// Render's build image does not always retain generated NodeBB template views
// in the running image. Compile only the templates on startup if they are
// missing; this is lightweight and avoids a full webpack build at runtime.
const templatesDir = path.join(__dirname, 'build', 'public', 'templates');
// `composer` is loaded on demand when the user clicks “New Topic”, so it
// must be present alongside the first-page templates.  Checking only the
// category shell allowed a partial Render build to start successfully, but
// left the button apparently unresponsive in the browser.
const requiredTemplates = [
	'categories.tpl', 'categories.js', 'header.js', 'footer.js',
	'composer.tpl', 'composer.js',
];
const missingTemplates = () => requiredTemplates.filter(file => !fs.existsSync(path.join(templatesDir, file)));

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
