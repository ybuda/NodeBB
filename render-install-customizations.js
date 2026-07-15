'use strict';

const fs = require('fs');
const path = require('path');

const customizationRoot = path.join(__dirname, 'render-customizations');
const harmonyRoot = path.join(__dirname, 'node_modules', 'nodebb-theme-harmony');

function copyDirectory(sourceDir, targetDir) {
	fs.mkdirSync(targetDir, { recursive: true });
	for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
		const source = path.join(sourceDir, entry.name);
		const target = path.join(targetDir, entry.name);
		if (entry.isDirectory()) {
			copyDirectory(source, target);
		} else {
			fs.copyFileSync(source, target);
		}
	}
}

copyDirectory(path.join(customizationRoot, 'templates'), path.join(harmonyRoot, 'templates'));
copyDirectory(path.join(customizationRoot, 'public'), path.join(harmonyRoot, 'public'));

const pluginPath = path.join(harmonyRoot, 'plugin.json');
const plugin = JSON.parse(fs.readFileSync(pluginPath, 'utf8'));
plugin.scripts = Array.isArray(plugin.scripts) ? plugin.scripts : [];
if (!plugin.scripts.includes('public/profile-hover-card.js')) {
	plugin.scripts.push('public/profile-hover-card.js');
}
fs.writeFileSync(pluginPath, `${JSON.stringify(plugin, null, 2)}\n`);

console.log('Installed Render theme customizations.');
