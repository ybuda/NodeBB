'use strict';

const nconf = require('nconf');
const path = require('path');

const configFile = path.resolve(__dirname, process.env.CONFIG || 'config.json');
nconf.argv().env().file({ file: configFile });

const prestart = require('./src/prestart');
prestart.setupWinston();
prestart.loadConfig(configFile);

async function ensureContactNavigation() {
	const db = require('./src/database');
	const navigation = require('./src/navigation/admin');

	await db.init();
	const items = await navigation.get();
	const existing = items.find(item => item.route === '/contact');

	if (existing) {
		if (!existing.enabled || existing.title !== 'יצירת קשר' || existing.iconClass !== 'fa-envelope') {
			existing.enabled = true;
			existing.title = 'יצירת קשר';
			existing.text = 'יצירת קשר';
			existing.iconClass = 'fa-envelope';
			existing.textClass = 'd-lg-none';
			await navigation.save(items);
		}
		console.log('Verified contact navigation item.');
		return;
	}

	items.push({
		route: '/contact',
		title: 'יצירת קשר',
		enabled: true,
		iconClass: 'fa-envelope',
		textClass: 'd-lg-none',
		text: 'יצירת קשר',
		groups: [],
	});
	await navigation.save(items);
	console.log('Added contact navigation item.');
}

ensureContactNavigation()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error(err.stack || err.message);
		process.exit(1);
	});
