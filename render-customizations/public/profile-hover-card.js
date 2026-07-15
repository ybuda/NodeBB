'use strict';

$(document).ready(function () {
	const selector = 'a[href*="/user/"]:not([data-profile-preview-disabled])';
	const cache = new Map();
	let showTimer;
	let hideTimer;
	let activeLink;
	let activeSlug;
	let requestId = 0;

	installStyles();

	$('body')
		.on('mouseenter.profilePreview', selector, function () {
			const link = $(this);
			const slug = getUserSlug(link.attr('href'));
			if (!slug || link.closest('.profile-hover-card').length) {
				return;
			}

			clearTimeout(hideTimer);
			activeLink = link;
			activeSlug = slug;
			showTimer = setTimeout(() => loadAndShow(slug, link), 350);
		})
		.on('mouseleave.profilePreview', selector, function () {
			clearTimeout(showTimer);
			scheduleHide();
		});

	$(window).on('action:ajaxify.start resize scroll', hideCard);

	function getUserSlug(href) {
		try {
			const url = new URL(href, window.location.origin);
			const marker = `${config.relative_path || ''}/user/`;
			const index = url.pathname.indexOf(marker);
			if (index === -1) {
				return '';
			}
			return decodeURIComponent(url.pathname.slice(index + marker.length).split('/')[0]);
		} catch (err) {
			return '';
		}
	}

	async function loadAndShow(slug, link) {
		const thisRequest = ++requestId;
		try {
			let user = cache.get(slug);
			if (!user || Date.now() - user.cachedAt > 120000) {
				user = await new Promise((resolve, reject) => {
					require(['api'], function (api) {
						api.get(`/api/user/${encodeURIComponent(slug)}`, {})
							.then(resolve).catch(reject);
					});
				});
				user.cachedAt = Date.now();
				cache.set(slug, user);
			}

			if (thisRequest !== requestId || activeSlug !== slug || !link.is(':hover')) {
				return;
			}
			renderCard(user, link);
		} catch (err) {
			// A private or deleted profile should behave like a normal link.
		}
	}

	function renderCard(user, link) {
		hideCard();
		activeLink = link;
		activeSlug = user.userslug;

		const profileUrl = `${config.relative_path}/user/${encodeURIComponent(user.userslug)}`;
		const card = $('<aside class="profile-hover-card" role="dialog" aria-label="תצוגה מקדימה של פרופיל"></aside>');
		const cover = $('<div class="profile-hover-card-cover"></div>');
		if (user['cover:url']) {
			cover.css('background-image', `linear-gradient(rgba(0, 0, 0, .3), rgba(0, 0, 0, .3)), url("${String(user['cover:url']).replace(/"/g, '%22')}")`);
		}

		const body = $('<div class="profile-hover-card-body"></div>');
		const avatarLink = $('<a class="profile-hover-card-avatar-link" data-profile-preview-disabled href=""></a>').attr('href', profileUrl);
		if (user.picture) {
			avatarLink.append($('<img class="profile-hover-card-avatar" alt="">').attr({ src: user.picture, alt: user.username }));
		} else {
			avatarLink.append($('<span class="profile-hover-card-avatar avatar avatar-rounded"></span>')
				.css('background-color', user['icon:bgColor'] || '#3f51b5')
				.text(user['icon:text'] || String(user.username || '?').charAt(0)));
		}

		const identity = $('<div class="profile-hover-card-identity"></div>');
		identity.append($('<a class="profile-hover-card-name" data-profile-preview-disabled href=""></a>')
			.attr('href', profileUrl).text(user.displayname || user.username));
		if (user.fullname && user.fullname !== user.username) {
			identity.append($('<div class="profile-hover-card-fullname"></div>').text(user.fullname));
		}
		identity.append($('<div class="profile-hover-card-status"></div>')
			.append($('<span class="profile-hover-card-status-dot"></span>').addClass(`status-${user.status || 'offline'}`))
			.append(document.createTextNode(statusLabel(user.status))));

		body.append(avatarLink, identity);
		body.append(buildActions(user, profileUrl));
		body.append(buildStats(user));
		card.append(cover, body);

		card.on('mouseenter', function () {
			clearTimeout(hideTimer);
		}).on('mouseleave', scheduleHide);

		$('body').append(card);
		positionCard(card, link);
		requestAnimationFrame(() => card.addClass('show'));
	}

	function buildActions(user, profileUrl) {
		const actions = $('<div class="profile-hover-card-actions"></div>');
		actions.append($('<a class="btn btn-sm btn-primary" data-profile-preview-disabled>פרופיל</a>').attr('href', profileUrl));

		if (app.user.uid && String(app.user.uid) !== String(user.uid)) {
			const follow = $('<button type="button" class="btn btn-sm btn-success">מעקב</button>');
			socket.emit('user.isFollowing', { uid: user.uid }, function (err, following) {
				if (!err) {
					follow.toggleClass('btn-success', !following).toggleClass('btn-outline-secondary', following)
						.text(following ? 'מפסיק מעקב' : 'מעקב').attr('data-following', following ? '1' : '0');
				}
			});
			follow.on('click', function () {
				const button = $(this);
				const following = button.attr('data-following') === '1';
				require(['api', 'alerts'], function (api, alerts) {
					api[following ? 'del' : 'put'](`/users/${user.uid}/follow`).then(function () {
						button.attr('data-following', following ? '0' : '1')
							.toggleClass('btn-success', following).toggleClass('btn-outline-secondary', !following)
							.text(following ? 'מעקב' : 'מפסיק מעקב');
					}).catch(alerts.error);
				});
			});
			actions.append(follow);

			if (!config.disableChat && user.canChat !== false) {
				const chatButton = $('<button type="button" class="btn btn-sm btn-outline-primary">צ׳אט</button>');
				chatButton.on('click', function () {
					require(['chat'], function (chat) {
						chat.newChat(user.uid);
					});
				});
				actions.append(chatButton);
			}
		}
		return actions;
	}

	function buildStats(user) {
		const stats = $('<div class="profile-hover-card-stats"></div>');
		[
			[user.counts && user.counts.posts !== undefined ? user.counts.posts : user.postcount, 'פוסטים'],
			[user.counts && user.counts.topics !== undefined ? user.counts.topics : user.topiccount, 'נושאים'],
			[user.followerCount, 'עוקבים'],
			[user.followingCount, 'עוקב אחרי'],
		].forEach(function (item) {
			stats.append($('<div></div>')
				.append($('<strong></strong>').text(utils.makeNumberHumanReadable(parseInt(item[0], 10) || 0)))
				.append($('<span></span>').text(item[1])));
		});
		return stats;
	}

	function statusLabel(status) {
		return status === 'online' ? 'מחובר עכשיו' : (status === 'away' ? 'לא פעיל' : 'לא מחובר');
	}

	function positionCard(card, link) {
		const rect = link[0].getBoundingClientRect();
		const width = card.outerWidth();
		const height = card.outerHeight();
		const gap = 10;
		let top = rect.bottom + gap;
		let left = $('html').attr('data-dir') === 'rtl' ? rect.right - width : rect.left;
		left = Math.max(gap, Math.min(left, window.innerWidth - width - gap));
		if (top + height > window.innerHeight - gap) {
			top = Math.max(gap, rect.top - height - gap);
		}
		card.css({ top, left });
	}

	function scheduleHide() {
		clearTimeout(hideTimer);
		hideTimer = setTimeout(hideCard, 180);
	}

	function hideCard() {
		clearTimeout(showTimer);
		$('.profile-hover-card').remove();
		activeLink = null;
		activeSlug = null;
		requestId += 1;
	}

	function installStyles() {
		if ($('#profile-hover-card-styles').length) {
			return;
		}
		$('<style id="profile-hover-card-styles">').text(`
			.profile-hover-card{position:fixed;width:340px;max-width:calc(100vw - 20px);z-index:1085;background:var(--bs-body-bg,#fff);color:var(--bs-body-color,#212529);border:1px solid var(--bs-border-color,#dee2e6);border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,.24);overflow:hidden;direction:rtl;opacity:0;transform:translateY(4px);transition:opacity .14s ease,transform .14s ease}
			.profile-hover-card.show{opacity:1;transform:translateY(0)}
			.profile-hover-card-cover{height:82px;background-color:#292929;background-image:linear-gradient(135deg,#363636,#202020);background-size:cover;background-position:center}
			.profile-hover-card-body{position:relative;padding:42px 18px 14px}
			.profile-hover-card-avatar-link{position:absolute;top:-38px;right:18px;text-decoration:none}
			.profile-hover-card-avatar{display:flex;width:72px;height:72px;align-items:center;justify-content:center;border:3px solid var(--bs-body-bg,#fff);border-radius:50%;object-fit:cover;font-size:28px;color:#fff}
			.profile-hover-card-identity{position:absolute;top:8px;right:102px;left:18px;min-width:0}
			.profile-hover-card-name{display:block;color:inherit;font-size:18px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-decoration:none}
			.profile-hover-card-fullname{color:var(--bs-secondary-color,#6c757d);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
			.profile-hover-card-status{display:flex;align-items:center;gap:5px;color:var(--bs-secondary-color,#6c757d);font-size:11px}
			.profile-hover-card-status-dot{width:7px;height:7px;border-radius:50%;background:#8a8d91}
			.profile-hover-card-status-dot.status-online{background:#31a24c}.profile-hover-card-status-dot.status-away{background:#f7b928}
			.profile-hover-card-actions{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:14px}
			.profile-hover-card-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding-top:12px;border-top:1px solid var(--bs-border-color,#dee2e6);text-align:center}
			.profile-hover-card-stats strong,.profile-hover-card-stats span{display:block}
			.profile-hover-card-stats strong{font-size:17px;font-weight:500}
			.profile-hover-card-stats span{color:var(--bs-secondary-color,#6c757d);font-size:10px;white-space:nowrap}
			@media (hover:none),(max-width:575.98px){.profile-hover-card{display:none!important}}
		`).appendTo('head');
	}
});
