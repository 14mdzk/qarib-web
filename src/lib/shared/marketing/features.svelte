<script lang="ts">
	import { m } from '$core/i18n';
	import Card from '$lib/shared/primitives/card.svelte';
</script>

<section id="fitur" class="section-features" aria-labelledby="features-heading">
	<div class="features-inner">
		<div class="features-head">
			<div class="eyebrow">{m.landing_features_eyebrow()}</div>
			<h2 id="features-heading">
				{m.landing_features_title_pre()}
				<span class="text-primary font-serif italic">{m.landing_features_title_em()}</span>
				{m.landing_features_title_post()}
			</h2>
		</div>
		<div class="features-grid">
			<Card class="p-9">
				<div class="feature-icon" aria-hidden="true">
					<svg
						width="22"
						height="22"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.7"
						stroke-linecap="round"
						stroke-linejoin="round"
						><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" /><line
							x1="9"
							y1="3"
							x2="9"
							y2="18"
						/><line x1="15" y1="6" x2="15" y2="21" /></svg
					>
				</div>
				<h3>{m.landing_feature_map_title()}</h3>
				<p>{m.landing_feature_map_body()}</p>
			</Card>
			<Card class="p-9">
				<div class="feature-icon" aria-hidden="true">
					<svg
						width="22"
						height="22"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.7"
						stroke-linecap="round"
						stroke-linejoin="round"
						><rect x="3" y="4" width="18" height="18" rx="2" /><line
							x1="16"
							y1="2"
							x2="16"
							y2="6"
						/><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg
					>
				</div>
				<h3>{m.landing_feature_calendar_title()}</h3>
				<p>{m.landing_feature_calendar_body()}</p>
			</Card>
			<Card class="p-9">
				<div class="feature-icon" aria-hidden="true">
					<svg
						width="22"
						height="22"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.7"
						stroke-linecap="round"
						stroke-linejoin="round"
						><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle
							cx="12"
							cy="7"
							r="4"
						/></svg
					>
				</div>
				<h3>{m.landing_feature_ustadz_title()}</h3>
				<p>{m.landing_feature_ustadz_body()}</p>
			</Card>
		</div>
	</div>
</section>

<style>
	.section-features {
		background: var(--color-surface);
		padding: 100px 24px;
	}

	.features-inner {
		max-width: 1200px;
		margin: 0 auto;
	}

	.features-head {
		text-align: center;
		margin-bottom: 56px;
	}

	.eyebrow {
		font-size: 12px;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		font-weight: 700;
		color: var(--color-primary);
		margin-bottom: 12px;
	}

	h2 {
		font-size: clamp(26px, 4vw, 40px);
		font-weight: 700;
		letter-spacing: -0.02em;
		margin: 0;
		color: var(--color-content);
	}

	.features-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 24px;
	}

	@media (min-width: 768px) {
		.features-grid {
			grid-template-columns: repeat(3, 1fr);
			gap: 32px;
		}
	}

	.feature-icon {
		width: 56px;
		height: 56px;
		border-radius: 16px;
		background: var(--color-orange-50);
		display: grid;
		place-items: center;
		color: var(--color-primary);
		margin-bottom: 22px;
	}

	h3 {
		font-size: 22px;
		font-weight: 700;
		letter-spacing: -0.01em;
		margin: 0 0 10px;
		color: var(--color-content);
	}

	p {
		font-size: 15px;
		color: var(--color-content-2);
		line-height: 1.6;
		margin: 0;
	}
</style>
