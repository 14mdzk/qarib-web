<script lang="ts">
	/**
	 * MapFab — round GPS FAB floating over the map, matching the v2 `.map-fab.gps` spec.
	 *
	 * White round button, ink GPS glyph, positioned bottom-right.
	 * When `loading` is true shows a Spinner and disables interaction.
	 * Purely presentational — no geolocation calls here.
	 *
	 * Conformance:
	 *   - .claude/rules/styling.md  (tokens; no arbitrary hex)
	 *   - .claude/rules/i18n.md     (aria-label via Paraglide)
	 *   - .claude/rules/architecture.md (shared/composites)
	 */
	import Spinner from '$lib/shared/primitives/spinner.svelte';
	import { m } from '$core/i18n';
	import { Locate } from '@lucide/svelte';

	interface Props {
		onlocate?: () => void;
		loading?: boolean;
	}

	let { onlocate, loading = false }: Props = $props();
</script>

<!--
  Positioned-absolute overlay — consumer places this over the map.
  Bottom-right with bottom offset supplied by the consumer via CSS custom property
  or inline style on the parent; default bottom:20px here.
-->
<button
	class="map-fab"
	class:loading
	onclick={onlocate}
	disabled={loading}
	aria-label={m.map_fab_gps_label()}
	aria-busy={loading}
>
	{#if loading}
		<Spinner size="sm" />
	{:else}
		<Locate class="text-primary/60 size-6" />
	{/if}
</button>

<style>
	/* ── FAB: round paper button bottom-right ──────────────────────────── */
	/* Consumer can lift FAB above pin sheet via --map-fab-bottom CSS custom property. */
	.map-fab {
		position: absolute;
		right: 14px;
		bottom: var(--map-fab-bottom, 20px);
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background: var(--color-paper);
		border: 1px solid var(--color-line);
		box-shadow: 0 4px 12px rgba(26, 21, 16, 0.15);
		display: grid;
		place-items: center;
		color: var(--color-ink);
		cursor: pointer;
		z-index: 999;
	}

	.map-fab:hover:not(:disabled) {
		box-shadow: 0 6px 16px rgba(26, 21, 16, 0.2);
	}

	/* Loading: pointer-events off, slight dim */
	.map-fab.loading {
		pointer-events: none;
		opacity: 0.75;
	}

	.map-fab:focus-visible {
		outline: 2px solid var(--color-orange);
		outline-offset: 2px;
	}
</style>
