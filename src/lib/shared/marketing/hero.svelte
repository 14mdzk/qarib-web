<script lang="ts">
	import { resolve } from '$app/paths';
	import { buttonClasses } from '$lib/shared/primitives/button-variants.js';
	import { m } from '$core/i18n';
</script>

<section class="bg-surface relative overflow-hidden">
	<!-- Decorative map backdrop -->
	<div class="map-backdrop" aria-hidden="true">
		<div class="map-bg"></div>
		<div class="map-roads"></div>
		<!-- Pulsing pin dots -->
		<div class="map-pin-dot" style="left:62%;top:28%"></div>
		<div class="map-pin-dot" style="left:78%;top:52%"></div>
		<div class="map-pin-dot" style="left:68%;top:70%"></div>
		<div class="map-pin-dot" style="left:55%;top:62%"></div>
		<!-- Hero pin with mosque glyph -->
		<div class="map-pin-hero">
			<div class="pin"><div class="pin-inner">🕌</div></div>
		</div>
		<!-- Legibility gradient over backdrop -->
		<div class="map-fade"></div>
	</div>

	<!-- Foreground copy -->
	<div class="relative z-10 mx-auto max-w-6xl px-6 py-16 sm:py-24 lg:py-32">
		<div class="max-w-xl">
			<div class="eyebrow">
				<span class="eyebrow-dot"></span>
				{m.landing_eyebrow()}
			</div>
			<h1
				class="text-content mt-4 text-4xl leading-tight font-bold tracking-tight sm:text-5xl lg:text-6xl"
			>
				<span class="font-arabic text-content-3 block text-2xl font-medium sm:text-3xl"
					>{m.app_title_ar()}</span
				>
				<span class="text-primary font-serif italic">{m.landing_hero_kajian()}</span>
				{m.landing_hero_headline()}
			</h1>
			<p class="text-content-2 mt-6 text-lg leading-relaxed sm:text-xl">
				{m.landing_hero_lede()}
			</p>
			<div class="mt-8 flex flex-wrap items-center gap-3">
				<a href={resolve('/peta')} class={buttonClasses({ variant: 'primary', size: 'lg' })}>
					{m.landing_cta_primary()}
				</a>
				<a href="#cara-kerja" class={buttonClasses({ variant: 'ghost', size: 'lg' })}>
					{m.landing_cta_secondary()}
				</a>
			</div>
		</div>
	</div>
</section>

<style>
	.map-backdrop {
		position: absolute;
		inset: 0;
		overflow: hidden;
	}

	.map-bg {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(ellipse at 20% 30%, var(--color-surface-2) 0%, transparent 50%),
			radial-gradient(ellipse at 80% 20%, var(--color-paper-3) 0%, transparent 45%),
			radial-gradient(ellipse at 50% 75%, var(--color-surface-2) 0%, transparent 55%),
			var(--color-surface-3);
	}

	.map-roads {
		position: absolute;
		inset: 0;
		opacity: 0.5;
	}

	.map-roads::before,
	.map-roads::after {
		content: '';
		position: absolute;
		background: var(--color-border-2);
	}

	.map-roads::before {
		left: 12%;
		right: -10%;
		top: 35%;
		height: 3px;
		transform: rotate(-3deg);
	}

	.map-roads::after {
		left: -5%;
		right: 30%;
		top: 65%;
		height: 3px;
		transform: rotate(2deg);
	}

	.map-fade {
		position: absolute;
		inset: 0;
		background: linear-gradient(to right, var(--color-surface) 55%, transparent 90%);
	}

	.map-pin-dot {
		position: absolute;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: var(--color-accent);
		border: 3px solid var(--color-surface);
		box-shadow: 0 2px 6px color-mix(in srgb, var(--color-content) 20%, transparent);
		z-index: 2;
		animation: pulse-dot 2.8s ease-out infinite;
	}

	.map-pin-hero {
		position: absolute;
		right: 22%;
		top: 38%;
		z-index: 2;
		animation: pulse-pin 2.4s ease-out infinite;
	}

	.map-pin-hero::before {
		content: '';
		position: absolute;
		width: 80px;
		height: 80px;
		border-radius: 50%;
		background: color-mix(in srgb, var(--color-accent) 30%, transparent);
		left: -18px;
		top: -10px;
		z-index: -1;
		animation: pulse-ring 2.4s ease-out infinite;
	}

	.pin {
		width: 44px;
		height: 44px;
		border-radius: 50% 50% 50% 0;
		background: var(--color-primary);
		transform: rotate(-45deg);
		box-shadow: 0 6px 16px color-mix(in srgb, var(--color-primary) 40%, transparent);
		display: grid;
		place-items: center;
	}

	.pin-inner {
		transform: rotate(45deg);
		font-size: 20px;
	}

	.eyebrow {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: 12px;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		font-weight: 700;
		color: var(--color-primary);
	}

	.eyebrow-dot {
		display: inline-block;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--color-accent);
		flex-shrink: 0;
	}

	@keyframes pulse-ring {
		0% {
			transform: scale(0.6);
			opacity: 1;
		}
		100% {
			transform: scale(1.8);
			opacity: 0;
		}
	}

	@keyframes pulse-pin {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-4px);
		}
	}

	@keyframes pulse-dot {
		0%,
		100% {
			transform: scale(1);
			opacity: 1;
		}
		50% {
			transform: scale(1.15);
			opacity: 0.85;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.map-pin-dot,
		.map-pin-hero,
		.map-pin-hero::before {
			animation: none;
		}
	}
</style>
