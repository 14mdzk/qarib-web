<script lang="ts">
	import { m } from '$core/i18n';
	import { getLocationPreference } from '$lib/core/location/preference.svelte.js';
	import { normaliseReturnTo } from '$lib/core/location/return-to.js';

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
		class="fixed inset-0 z-50"
		role="dialog"
		aria-modal="true"
		aria-label={m.setting_location_label()}
		onkeydown={handleKeydown}
	>
		<div class="absolute inset-0 bg-black/15" onclick={handleClose} role="presentation"></div>

		<div
			class="absolute right-0 bottom-0 left-0 mx-auto w-full max-w-lg md:inset-0 md:flex md:items-center md:justify-center"
		>
			<div
				class="bg-paper mx-0 rounded-t-[22px] px-4 pt-3 pb-6 shadow-lg md:mx-4 md:rounded-2xl md:pt-5"
			>
				<div class="bg-line-2 mx-auto mb-1 h-[5px] w-[44px] rounded-sm md:hidden"></div>

				<h2 class="text-ink mb-4 text-lg font-bold tracking-tight">{m.setting_location_label()}</h2>

				<div>
					<div class="text-ink-3 mb-1 text-[11px] font-bold tracking-wide uppercase">
						{m.lokasi_title()}
					</div>
					<div class="bg-paper-2 border-line rounded-xl border p-3">
						<div class="text-ink-3 text-[11px]">{m.setting_mode_current()}</div>
						<div class="text-ink mt-1 text-sm font-bold">{summary || '—'}</div>
					</div>

					<div class="mt-3 flex gap-2">
						<!-- eslint-disable svelte/no-navigation-without-resolve -->
						<a
							href={gantiUrl}
							class="border-line bg-paper-2 text-ink flex flex-1 items-center justify-center rounded-xl border py-2.5 text-sm font-semibold"
						>
							{m.setting_ganti_lokasi()}
							<!-- eslint-enable svelte/no-navigation-without-resolve -->
						</a>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
