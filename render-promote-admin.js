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

	await db.init();
	const uid = await User.getUidByEmail(email);
	if (!uid) {
		throw new Error(`No existing NodeBB user was found for ${email}.`);
	}

	await Groups.join('administrators', uid);
	console.log(`Promoted existing user ${uid} to administrator.`);
}

promoteExistingAdmin()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error(err.stack || err.message);
		process.exit(1);
	});
