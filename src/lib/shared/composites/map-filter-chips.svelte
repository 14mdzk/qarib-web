<script lang="ts">
	/**
	 * MapFilterChips — floating horizontally-scrollable chip row that overlays
	 * the top of the map, matching the v2 `.map-top-chips` spec.
	 *
	 * Backdrop-blur white pills; active chip is ink-filled.
	 * Purely presentational — no fetching, no routing.
	 *
	 * Conformance:
	 *   - .claude/rules/styling.md  (tokens; no arbitrary hex)
	 *   - .claude/rules/i18n.md     (all labels come from caller via props)
	 *   - .claude/rules/architecture.md (shared/composites)
	 */

	export interface FilterChip {
		key: string;
		label: string;
		active?: boolean;
	}

	interface Props {
		chips: FilterChip[];
		onselect?: (key: string) => void;
	}

	import { m } from '$core/i18n';

	let { chips, onselect }: Props = $props();
</script>

<!--
  Positioned-absolute overlay — consumer places this over the map.
  Horizontal scroll with hidden scrollbar (matches .map-top-chips in spec).
-->
<div class="map-top-chips" role="toolbar" aria-label={m.map_filter_chips_label()}>
	{#each chips as chip (chip.key)}
		<button
			class="chip"
			class:active={chip.active}
			onclick={() => onselect?.(chip.key)}
			aria-pressed={chip.active ?? false}
		>
			{chip.label}
		</button>
	{/each}
</div>

<style>
	/* ── Container: absolute overlay at map top ────────────────────────── */
	.map-top-chips {
		position: absolute;
		top: 8px;
		left: 10px;
		right: 10px;
		z-index: 999;
		display: flex;
		gap: 6px;
		overflow-x: auto;
		scrollbar-width: none;
	}

	.map-top-chips::-webkit-scrollbar {
		display: none;
	}

	/* ── Chip: backdrop-blur white pill ────────────────────────────────── */
	.chip {
		flex-shrink: 0;
		height: 32px;
		padding: 0 12px;
		border-radius: 16px;
		background: rgba(255, 255, 255, 0.94);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(26, 21, 16, 0.08);
		box-shadow: 0 2px 6px rgba(26, 21, 16, 0.08);
		color: var(--color-ink-2);
		font-size: 12.5px;
		font-weight: 500;
		display: inline-flex;
		align-items: center;
		gap: 5px;
		cursor: pointer;
		font-family: inherit;
		white-space: nowrap;
	}

	/* ── Active: ink fill ──────────────────────────────────────────────── */
	.chip.active {
		background: var(--color-ink);
		color: white;
		border-color: var(--color-ink);
		font-weight: 600;
	}

	.chip:focus-visible {
		outline: 2px solid var(--color-orange);
		outline-offset: 2px;
	}
</style>
