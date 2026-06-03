<script lang="ts">
	import { m } from '$core/i18n';
</script>

<section id="cara-kerja" class="section-problem" aria-labelledby="problem-heading">
	<div class="problem-inner">
		<div class="eyebrow-line">
			<span class="eyebrow-text">{m.landing_problem_eyebrow()}</span>
		</div>
		<h2 id="problem-heading">
			{m.landing_problem_title_pre()}
			<span class="text-primary font-serif italic">{m.landing_problem_title_em()}</span>
			{m.landing_problem_title_post()}
		</h2>
		<p>{m.landing_problem_body()}</p>
	</div>
</section>

<style>
	.section-problem {
		background: var(--color-surface-3);
		padding: 96px 24px;
	}

	.problem-inner {
		max-width: 780px;
		margin: 0 auto;
		text-align: center;
	}

	.eyebrow-line {
		display: inline-flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 18px;
	}

	.eyebrow-line::before,
	.eyebrow-line::after {
		content: '';
		width: 28px;
		height: 1px;
		background: var(--color-accent);
	}

	.eyebrow-text {
		font-size: 11px;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		font-weight: 700;
		color: var(--color-primary);
	}

	h2 {
		font-size: clamp(28px, 5vw, 42px);
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1.15;
		margin: 0 0 20px;
		color: var(--color-content);
	}

	p {
		font-size: 18px;
		color: var(--color-content-2);
		line-height: 1.65;
		margin: 0 auto;
		max-width: 620px;
	}
</style>
