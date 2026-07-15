'use strict';

const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, 'render-customizations', 'templates');
const targetDir = path.join(__dirname, 'node_modules', 'nodebb-theme-harmony', 'templates');

fs.mkdirSync(targetDir, { recursive: true });
for (const filename of fs.readdirSync(sourceDir)) {
	fs.copyFileSync(path.join(sourceDir, filename), path.join(targetDir, filename));
}

console.log('Installed Render theme customizations.');
