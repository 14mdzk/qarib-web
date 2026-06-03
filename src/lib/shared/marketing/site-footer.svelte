<script lang="ts">
	import { m } from '$core/i18n';
</script>

<footer class="site-footer">
	<div class="footer-brand">
		<span class="logo">{m.app_title()}</span>
		<span>{m.landing_footer_copy()}</span>
	</div>
	<div class="footer-dua">
		<span class="font-arabic">{m.landing_footer_dua_ar()}</span>
		{m.landing_footer_dua()}
	</div>
	<div class="footer-links">
		<!-- TODO: make these links when /privasi + /kontak pages ship -->
		<span class="text-content-3">{m.landing_footer_privacy()}</span>
		<span class="text-content-3">{m.landing_footer_contact()}</span>
	</div>
</footer>

<style>
	.site-footer {
		padding: 32px 24px;
		background: var(--color-surface-2);
		border-top: 1px solid var(--color-border);
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 16px;
		font-size: 12px;
		color: var(--color-content-3);
	}

	.footer-brand {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.logo {
		font-weight: 800;
		color: var(--color-primary);
	}

	.footer-dua {
		font-style: italic;
		color: var(--color-content-3);
	}

	.footer-links {
		display: flex;
		gap: 14px;
	}

	.footer-links span {
		color: var(--color-content-3);
	}
</style>
