'use strict';

const helpers = require('./helpers');

module.exports = async function (req, res) {
	res.render('contact', {
		title: 'יצירת קשר',
		breadcrumbs: helpers.buildBreadcrumbs([{
			text: 'יצירת קשר',
		}]),
	});
};
