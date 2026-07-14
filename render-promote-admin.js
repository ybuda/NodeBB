'use strict';

const nconf = require('nconf');
const path = require('path');

const configFile = path.resolve(__dirname, process.env.CONFIG || 'config.json');
nconf.argv().env().file({ file: configFile });

const prestart = require('./src/prestart');
prestart.setupWinston();
prestart.loadConfig(configFile);

async function promoteExistingAdmin() {
	const email = process.env.NODEBB_ADMIN_EMAIL;
	if (!email) {
		throw new Error('NODEBB_ADMIN_EMAIL is required to promote an existing administrator.');
	}

	const db = require('./src/database');
	const User = require('./src/user');
	const Groups = require('./src/groups');
	const privileges = require('./src/privileges');

	await db.init();
	const uid = await User.getUidByEmail(email);
	if (!uid) {
		// A brand-new database has no administrator yet. This is expected: the
		// caller must run NodeBB's installer in that case.
		process.exitCode = 2;
		return;
	}

	await Groups.join('administrators', uid);
	// A setup interrupted after creating a user can miss NodeBB's default
	// global permissions. Without this privilege NodeBB deliberately hides the
	// username/password form from guests.
	await privileges.global.give(['groups:local:login'], 'registered-users');
	console.log(`Verified existing user ${uid} as administrator.`);
}

promoteExistingAdmin()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error(err.stack || err.message);
		process.exit(1);
	});
