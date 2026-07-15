<!-- IMPORT partials/breadcrumbs.tpl -->
<div data-widget-area="header">
	{{{ each widgets.header }}}
	{{widgets.header.html}}
	{{{ end }}}
</div>
<div class="row">
	<div class="{{{ if widgets.sidebar.length }}}col-lg-9 col-sm-12{{{ else }}}col-lg-12{{{ end }}}">
		{{{ if pagination.pages.length }}}
		<div><!-- IMPORT partials/category/selector-dropdown-left.tpl --></div>
		{{{ else }}}
		<h1 class="categories-title text-uppercase text-sm mb-2 fw-normal">[[pages:categories]]</h1>
		{{{ end }}}
		<ul class="categories list-unstyled" itemscope itemtype="http://www.schema.org/ItemList">
			{{{ each categories }}}
			<!-- IMPORT partials/categories/item.tpl -->
			{{{ end }}}
		</ul>
		<!-- IMPORT partials/paginator.tpl -->
	</div>
	<div data-widget-area="sidebar" class="col-lg-3 col-sm-12 {{{ if !widgets.sidebar.length }}}hidden{{{ end }}}">
		{{{ each widgets.sidebar }}}
		{{widgets.sidebar.html}}
		{{{ end }}}
	</div>
</div>

{{{ if showHomepageStats }}}
<section class="border-top mt-4 pt-4 pb-2" aria-label="סטטיסטיקות הפורום">
	<div class="row g-4 text-center" dir="rtl">
		<div class="col-6 col-md-3">
			<div class="fs-4 fw-normal text-body" title="{homepageStats.onlineCount}">{humanReadableNumber(homepageStats.onlineCount)}</div>
			<div class="text-muted mt-1">מחוברים</div>
		</div>
		<div class="col-6 col-md-3">
			<div class="fs-4 fw-normal text-body" title="{homepageStats.userCount}">{humanReadableNumber(homepageStats.userCount)}</div>
			<div class="text-muted mt-1">משתמשים</div>
		</div>
		<div class="col-6 col-md-3">
			<div class="fs-4 fw-normal text-body" title="{homepageStats.topicCount}">{humanReadableNumber(homepageStats.topicCount)}</div>
			<div class="text-muted mt-1">נושאים</div>
		</div>
		<div class="col-6 col-md-3">
			<div class="fs-4 fw-normal text-body" title="{homepageStats.postCount}">{humanReadableNumber(homepageStats.postCount)}</div>
			<div class="text-muted mt-1">פוסטים</div>
		</div>
	</div>
</section>
{{{ end }}}

<div data-widget-area="footer">
	{{{ each widgets.footer }}}
	{{widgets.footer.html}}
	{{{ end }}}
</div>
