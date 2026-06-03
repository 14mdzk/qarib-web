<script lang="ts">
	import { resolve } from '$app/paths';
	import { buttonClasses } from '$lib/shared/primitives/button-variants.js';
	import { m } from '$core/i18n';
</script>

<section class="section-cta" aria-labelledby="cta-heading">
	<div class="cta-inner">
		<h2 id="cta-heading">
			{m.landing_cta_title_pre()}
			<span class="text-primary font-serif italic">{m.landing_cta_title_em()}</span>
			{m.landing_cta_title_post()}
		</h2>
		<p>{m.landing_cta_body()}</p>
		<div class="cta-row">
			<a href={resolve('/peta')} class={buttonClasses({ variant: 'primary', size: 'lg' })}>
				{m.landing_cta_open_browser()}
			</a>
		</div>
		<div class="store-row">
			<div
				class="store-badge"
				role="img"
				aria-label="{m.landing_store_soon()} {m.landing_store_appstore()}"
			>
				<svg viewBox="0 0 384 512" fill="currentColor" width="20" height="20" aria-hidden="true"
					><path
						d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
					/></svg
				>
				<div aria-hidden="true">
					<div class="badge-small">{m.landing_store_soon()}</div>
					<div class="badge-big">{m.landing_store_appstore()}</div>
				</div>
			</div>
			<div
				class="store-badge"
				role="img"
				aria-label="{m.landing_store_soon()} {m.landing_store_googleplay()}"
			>
				<svg viewBox="0 0 512 512" fill="currentColor" width="20" height="20" aria-hidden="true"
					><path
						d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"
					/></svg
				>
				<div aria-hidden="true">
					<div class="badge-small">{m.landing_store_soon()}</div>
					<div class="badge-big">{m.landing_store_googleplay()}</div>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	.section-cta {
		background: var(--color-surface-3);
		padding: 96px 24px;
		position: relative;
		overflow: hidden;
	}

	.cta-inner {
		max-width: 780px;
		margin: 0 auto;
		text-align: center;
		position: relative;
		z-index: 2;
	}

	h2 {
		font-size: clamp(30px, 5vw, 46px);
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1.12;
		margin: 0 0 18px;
		color: var(--color-content);
	}

	p {
		font-size: 17px;
		color: var(--color-content-2);
		margin: 0 0 30px;
	}

	.cta-row {
		display: flex;
		justify-content: center;
		margin-bottom: 24px;
	}

	.store-row {
		display: flex;
		gap: 12px;
		justify-content: center;
		flex-wrap: wrap;
	}

	.store-badge {
		background: var(--color-content);
		color: var(--color-surface);
		border-radius: 10px;
		padding: 10px 14px;
		display: flex;
		align-items: center;
		gap: 10px;
		cursor: default;
		opacity: 0.6;
	}

	.badge-small {
		font-size: 9px;
		letter-spacing: 0.05em;
		opacity: 0.8;
		line-height: 1;
	}

	.badge-big {
		font-size: 14px;
		font-weight: 700;
		letter-spacing: -0.01em;
		line-height: 1.1;
	}
</style>
