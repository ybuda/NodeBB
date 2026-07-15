<div class="row justify-content-center">
	<div class="col-12 col-md-8 col-lg-6">
		<div class="card border-0 shadow-sm">
			<div class="card-body p-4 p-md-5">
				<div class="text-center mb-4">
					<i class="fa fa-envelope text-primary fs-1 mb-3" aria-hidden="true"></i>
					<h2 class="fw-semibold mb-2">יצירת קשר</h2>
					<p class="text-muted mb-0">יש לכם שאלה או הודעה? מלאו את הטופס ונחזור אליכם בהקדם.</p>
				</div>

				<form action="https://formspree.io/f/xqeraokn" method="POST" class="d-flex flex-column gap-3">
					<input type="hidden" name="_subject" value="הודעה חדשה מטופס יצירת הקשר בפורום" />

					<div>
						<label for="contact-name" class="form-label">שם</label>
						<input id="contact-name" name="name" type="text" class="form-control" autocomplete="name" required />
					</div>

					<div>
						<label for="contact-email" class="form-label">כתובת אימייל</label>
						<input id="contact-email" name="email" type="email" class="form-control" autocomplete="email" dir="ltr" required />
					</div>

					<div>
						<label for="contact-subject" class="form-label">נושא</label>
						<input id="contact-subject" name="subject" type="text" class="form-control" required />
					</div>

					<div>
						<label for="contact-message" class="form-label">הודעה</label>
						<textarea id="contact-message" name="message" class="form-control" rows="6" required></textarea>
					</div>

					<button type="submit" class="btn btn-primary align-self-start px-4">
						<i class="fa fa-paper-plane me-1" aria-hidden="true"></i>
						שליחת הודעה
					</button>
				</form>
			</div>
		</div>
	</div>
</div>
