'use strict';

define('forum/contact', ['alerts'], function (alerts) {
	const Contact = {};

	Contact.init = function () {
		const form = document.getElementById('contact-form');
		const submit = document.getElementById('contact-submit');
		if (!form || !submit) {
			return;
		}

		form.addEventListener('submit', async function (event) {
			event.preventDefault();
			if (!form.reportValidity() || submit.disabled) {
				return;
			}

			const originalText = submit.innerHTML;
			submit.disabled = true;
			submit.innerHTML = '<i class="fa fa-spinner fa-spin me-1" aria-hidden="true"></i> שולח...';

			try {
				const response = await fetch(form.action, {
					method: 'POST',
					body: new FormData(form),
					headers: {
						Accept: 'application/json',
					},
				});

				if (!response.ok) {
					throw new Error('Formspree rejected the submission');
				}

				form.reset();
				alerts.success('הטופס נשלח בהצלחה!');
			} catch (err) {
				alerts.error('שליחת הטופס נכשלה. נסו שוב בעוד מספר רגעים.');
			} finally {
				submit.disabled = false;
				submit.innerHTML = originalText;
			}
		});
	};

	return Contact;
});
