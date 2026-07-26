'use strict';

const fs = require('fs');
const path = require('path');

const customizationRoot = path.join(__dirname, 'render-customizations');
const harmonyRoot = path.join(__dirname, 'node_modules', 'nodebb-theme-harmony');
const uploadsRoot = path.join(__dirname, 'public', 'uploads', 'system');

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
fs.mkdirSync(uploadsRoot, { recursive: true });
fs.copyFileSync(
	path.join(customizationRoot, 'assets', 'site-logo.png'),
	path.join(uploadsRoot, 'site-logo.png')
);

const pluginPath = path.join(harmonyRoot, 'plugin.json');
const plugin = JSON.parse(fs.readFileSync(pluginPath, 'utf8'));
plugin.scripts = Array.isArray(plugin.scripts) ? plugin.scripts : [];
if (!plugin.scripts.includes('public/profile-hover-card.js')) {
	plugin.scripts.push('public/profile-hover-card.js');
}
plugin.scss = Array.isArray(plugin.scss) ? plugin.scss : [];
if (!plugin.scss.includes('public/logo-banner.scss')) {
	plugin.scss.push('public/logo-banner.scss');
}
if (!plugin.scss.includes('public/post-actions-always-visible.scss')) {
	plugin.scss.push('public/post-actions-always-visible.scss');
}
fs.writeFileSync(pluginPath, `${JSON.stringify(plugin, null, 2)}\n`);

console.log('Installed Render theme customizations.');
