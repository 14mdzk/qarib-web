<script lang="ts">
	/**
	 * LocationSettings — bottom sheet for viewing/changing the active location.
	 *
	 * Anchored to the viewport bottom on all breakpoints.  Shows the current
	 * preference summary and a link to /lokasi for replacement.  No hapus, no
	 * language controls per v1 plan.
	 *
	 * Styling mirrors PinSheet (shared tokens, grab handle, border-radius, shadow).
	 *
	 * Conformance:
	 *   - .claude/rules/styling.md     (tokens only; no arbitrary values)
	 *   - .claude/rules/i18n.md        (all user-facing strings via Paraglide)
	 *   - .claude/rules/architecture.md (shared/composites)
	 */
	import { m } from '$core/i18n';
	import { getLocationPreference, normaliseReturnTo } from '$lib/core/location/index.svelte.js';

	interface Props {
		open: boolean;
		onclose: () => void;
		currentPath: string;
	}

	let { open = false, onclose, currentPath = '/peta' }: Props = $props();

	const pref = getLocationPreference();
	const summary = $derived(pref.summary());
	const gantiUrl = $derived(
		`/lokasi?returnTo=${encodeURIComponent(normaliseReturnTo(currentPath))}`
	);

	function handleClose() {
		onclose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') handleClose();
	}
</script>

{#if open}
	<div
		class="settings-overlay"
		role="dialog"
		aria-modal="true"
		aria-label={m.setting_location_label()}
		tabindex="-1"
		onkeydown={handleKeydown}
	>
		<!-- Backdrop -->
		<button class="settings-backdrop" onclick={handleClose} aria-label={m.setting_close()}></button>

		<!-- Sheet -->
		<div class="settings-sheet">
			<!-- Grab handle -->
			<div class="settings-handle" role="presentation"></div>

			<div class="settings-body">
				<h2 class="settings-title">{m.setting_location_label()}</h2>

				<div>
					<div class="settings-label">{m.lokasi_title()}</div>
					<div class="settings-card">
						<div class="settings-mode">{m.setting_mode_current()}</div>
						<div class="settings-summary">{summary || '—'}</div>
					</div>

					<div class="settings-actions">
						<!-- eslint-disable svelte/no-navigation-without-resolve -->
						<a href={gantiUrl} class="settings-btn">
							{m.setting_ganti_lokasi()}
						</a>
						<!-- eslint-enable svelte/no-navigation-without-resolve -->
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	/* ── Overlay ────────────────────────────────────────────────────────── */
	.settings-overlay {
		position: fixed;
		inset: 0;
		z-index: 999;
		display: flex;
		align-items: flex-end;
		justify-content: center;
	}

	/* ── Backdrop ───────────────────────────────────────────────────────── */
	.settings-backdrop {
		position: absolute;
		inset: 0;
		background: rgb(0 0 0 / 0.15);
		border: none;
		cursor: default;
		/* reset button styles */
		padding: 0;
		font: inherit;
	}

	/* ── Sheet ──────────────────────────────────────────────────────────── */
	.settings-sheet {
		position: relative;
		width: 100%;
		max-width: 28rem;
		background: var(--color-paper);
		border-top-left-radius: 20px;
		border-top-right-radius: 20px;
		box-shadow: var(--shadow-lg);
		display: flex;
		flex-direction: column;
		/* Slide-up entrance */
		animation: settings-slide-up 0.24s cubic-bezier(0.2, 0.8, 0.2, 1);
	}

	/* honour prefers-reduced-motion */
	@media (prefers-reduced-motion: reduce) {
		.settings-sheet {
			animation-duration: 0.01ms;
		}
	}

	@keyframes settings-slide-up {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}

	/* ── Grab handle ───────────────────────────────────────────────────── */
	.settings-handle {
		width: 40px;
		height: 4px;
		background: var(--color-line-2);
		border-radius: 2px;
		margin: 8px auto 6px;
		flex-shrink: 0;
	}

	/* ── Body ───────────────────────────────────────────────────────────── */
	.settings-body {
		padding: 6px 16px 18px;
		overflow-y: auto;
	}

	.settings-title {
		color: var(--color-ink);
		font-size: 16px;
		font-weight: 800;
		letter-spacing: -0.01em;
		margin: 0 0 14px;
		padding-bottom: 10px;
		border-bottom: 1px solid var(--color-line);
	}

	/* ── Content ────────────────────────────────────────────────────────── */
	.settings-label {
		color: var(--color-ink-3);
		font-size: 11px;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		margin-bottom: 6px;
	}

	.settings-card {
		background: var(--color-paper-2);
		border: 1px solid var(--color-line);
		border-radius: 12px;
		padding: 12px;
	}

	.settings-mode {
		color: var(--color-ink-3);
		font-size: 11px;
	}

	.settings-summary {
		color: var(--color-ink);
		font-size: 14px;
		font-weight: 700;
		margin-top: 4px;
	}

	/* ── Actions ────────────────────────────────────────────────────────── */
	.settings-actions {
		margin-top: 12px;
		display: flex;
		gap: 8px;
	}

	.settings-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 10px 0;
		border-radius: 12px;
		border: 1px solid var(--color-line);
		background: var(--color-paper-2);
		color: var(--color-ink);
		font-size: 13px;
		font-weight: 700;
		text-decoration: none;
		cursor: pointer;
		font-family: inherit;
	}

	.settings-btn:hover {
		background: var(--color-paper-3);
	}

	.settings-btn:focus-visible {
		outline: 2px solid var(--color-orange);
		outline-offset: 2px;
	}
</style>
