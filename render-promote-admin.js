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
	const username = process.env.NODEBB_ADMIN_USERNAME || 'yair';

	const db = require('./src/database');
	const User = require('./src/user');
	const Groups = require('./src/groups');
	const privileges = require('./src/privileges');

	await db.init();
	const uid = (email && await User.getUidByEmail(email)) || await User.getUidByUsername(username);
	if (!uid) {
		// A brand-new database has no administrator yet. This is expected: the
		// caller must run NodeBB's installer in that case.
		process.exitCode = 2;
		return;
	}

	await Groups.join('administrators', uid);
	await Groups.ownership.grant(uid, 'administrators');
	// A setup interrupted after creating a user can miss NodeBB's default
	// global permissions. Restore the permissions needed by ordinary accounts
	// for local login, chats, and the user/group directories on every start.
	await privileges.global.give([
		'groups:local:login',
		'groups:chat',
		'groups:view:users',
		'groups:view:groups',
	], 'registered-users');
	console.log(`Verified existing user ${uid} as administrator.`);
}

promoteExistingAdmin()
	.then(() => process.exit(process.exitCode || 0))
	.catch((err) => {
		console.error(err.stack || err.message);
		process.exit(1);
	});
