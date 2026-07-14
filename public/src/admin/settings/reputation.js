'use strict';

// The reputation settings page uses the shared settings controller. Keeping a
// route module here lets the admin loader resolve `settings/reputation`.
define('admin/settings/reputation', ['admin/settings'], function (Settings) {
	return Settings;
});
