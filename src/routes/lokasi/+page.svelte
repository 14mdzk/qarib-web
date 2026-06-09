<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { m } from '$core/i18n';
	import { createLocation } from '$lib/core/location/index.svelte.js';
	import {
		createLocationPreference,
		type StagedChoice
	} from '$lib/core/location/preference.svelte.js';
	import { fetchProvinces, fetchCities, type RegionResponse } from '$domains/regions';

	let { data } = $props();

	// Context services
	const loc = createLocation();
	const pref = createLocationPreference();

	// -------------------------------------------------------------------
	// Mode derivation
	// -------------------------------------------------------------------

	const markerPresent = $derived(data.markerPresent === true);
	const preferenceValid = $derived(pref.active !== null);
	const activeLabel = $derived(pref.summary());

	type OnboardingMode = 'first-run' | 'marker-recovery' | 'storage-recovery' | 'replacement';
	const mode: OnboardingMode = $derived(
		!markerPresent && !preferenceValid
			? 'first-run'
			: !markerPresent && preferenceValid
				? 'marker-recovery'
				: markerPresent && !preferenceValid
					? 'storage-recovery'
					: 'replacement'
	);

	// -------------------------------------------------------------------
	// Staged choice
	// -------------------------------------------------------------------

	let stagedMode = $state<'gps' | 'manual' | null>(null);
	let stagedCoords = $state<{ lat: number; lng: number } | null>(null);
	let stagedProvince = $state<RegionResponse | null>(null);
	let stagedCity = $state<RegionResponse | null>(null);

	// Prefill in replacement mode
	let prefilled = $state(false);
	$effect(() => {
		if (prefilled || !browser) return;
		if (mode === 'replacement' && pref.active) {
			prefilled = true;
			if (pref.active.mode === 'manual') {
				stagedMode = 'manual';
				stagedProvince = {
					id: pref.active.province.id,
					name: pref.active.province.name
				} as RegionResponse;
				stagedCity = { id: pref.active.city.id, name: pref.active.city.name } as RegionResponse;
			}
		}
	});

	// -------------------------------------------------------------------
	// GPS
	// -------------------------------------------------------------------

	function activateGps() {
		loc.requestGps();
	}

	$effect(() => {
		if (loc.permission === 'granted' && loc.center) {
			stagedMode = 'gps';
			stagedCoords = { lat: loc.center.lat, lng: loc.center.lng };
		}
	});

	// -------------------------------------------------------------------
	// Region fetching
	// -------------------------------------------------------------------

	let provinces = $state<RegionResponse[]>([]);
	let cities = $state<RegionResponse[]>([]);
	let loadingCities = $state(false);

	$effect(() => {
		if (!browser) return;
		fetchProvinces().then((p) => (provinces = p));
	});

	$effect(() => {
		if (!browser || !stagedProvince?.id) {
			cities = [];
			return;
		}
		loadingCities = true;
		fetchCities(stagedProvince.id).then((c) => {
			cities = c;
			loadingCities = false;
		});
	});

	function selectProvince(p: RegionResponse) {
		stagedProvince = p;
		stagedCity = null;
	}

	// -------------------------------------------------------------------
	// Save readiness
	// -------------------------------------------------------------------

	const canSave = $derived(
		(stagedMode === 'gps' && stagedCoords !== null) ||
			(stagedMode === 'manual' && stagedProvince !== null && stagedCity !== null)
	);

	// -------------------------------------------------------------------
	// Completion
	// -------------------------------------------------------------------

	let completionError = $state(false);
	let storageError = $state(false);

	function handleCompletion() {
		if (!canSave) return;

		let choice: StagedChoice;
		if (stagedMode === 'gps' && stagedCoords) {
			choice = { mode: 'gps', coordinates: stagedCoords };
		} else if (stagedMode === 'manual' && stagedProvince && stagedCity) {
			choice = {
				mode: 'manual',
				province: { id: stagedProvince.id!, name: stagedProvince.name! },
				city: { id: stagedCity.id!, name: stagedCity.name! }
			};
		} else {
			return;
		}

		try {
			pref.commitStaged(choice);
		} catch {
			storageError = true;
			return;
		}
	}

	// -------------------------------------------------------------------
	// Marker recovery — restore only cookie
	// -------------------------------------------------------------------

	function handleRecovery() {
		completionError = false;
		// The form action sets the cookie; no preference data is sent.
		const form = document.querySelector('form') as HTMLFormElement;
		form?.requestSubmit();
	}

	// -------------------------------------------------------------------
	// Cancel (replacement mode only)
	// -------------------------------------------------------------------

	function handleCancel() {
		const target = data.returnTo;
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(target, { replaceState: true });
	}
</script>

<!-- ── First-run / storage-recovery: full picker ── -->
{#if mode === 'first-run' || mode === 'storage-recovery'}
	<div class="mx-auto max-w-lg px-4 pt-6 pb-16">
		<div class="mb-6 flex flex-col items-center gap-2 text-center">
			<div class="text-orange flex h-14 w-14 items-center justify-center rounded-full bg-orange-50">
				<svg
					width="28"
					height="28"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
					><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /><line
						x1="12"
						y1="2"
						x2="12"
						y2="6"
					/><line x1="12" y1="18" x2="12" y2="22" /><line x1="2" y1="12" x2="6" y2="12" /><line
						x1="18"
						y1="12"
						x2="22"
						y2="12"
					/></svg
				>
			</div>
			<h1 class="text-ink text-2xl font-extrabold tracking-tight">{m.lokasi_title()}</h1>
			<p class="text-ink-3 text-sm leading-relaxed">{m.lokasi_subtitle()}</p>
		</div>

		{#if mode === 'storage-recovery'}
			<div
				role="alert"
				class="mb-4 rounded border border-orange-100 bg-orange-50 p-3 text-sm text-orange-700"
			>
				{m.lokasi_storage_recovery_warning()}
			</div>
		{/if}

		<div class="flex flex-col gap-3">
			<button
				class="bg-orange text-paper flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold shadow-sm"
				onclick={activateGps}
				disabled={loc.requesting}
			>
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
					><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /><line
						x1="12"
						y1="2"
						x2="12"
						y2="6"
					/><line x1="12" y1="18" x2="12" y2="22" /><line x1="2" y1="12" x2="6" y2="12" /><line
						x1="18"
						y1="12"
						x2="22"
						y2="12"
					/></svg
				>
				{loc.requesting ? '...' : m.lokasi_gps_button()}
			</button>

			{#if loc.permission === 'denied'}
				<div role="alert" class="rounded border border-orange-200 bg-white p-3 text-sm">
					<p class="text-ink font-semibold">{m.lokasi_gps_denied_title()}</p>
					<p class="text-ink-3 mt-1">{m.lokasi_gps_denied_body()}</p>
				</div>
			{/if}
			{#if loc.permission === 'unavailable'}
				<div role="alert" class="rounded border border-orange-200 bg-white p-3 text-sm">
					<p class="text-ink font-semibold">{m.lokasi_gps_unavailable()}</p>
				</div>
			{/if}

			<div class="text-ink-4 my-1 flex items-center gap-3 text-xs">
				<hr class="border-line flex-1" />
				{m.lokasi_manual_divider()}
				<hr class="border-line flex-1" />
			</div>

			<!-- Province -->
			<div>
				<label
					for="lokasi-province"
					class="text-ink-3 mb-1 block text-[11px] font-bold tracking-wide uppercase"
					>{m.lokasi_province_label()}</label
				>
				<select
					id="lokasi-province"
					class="border-line bg-paper text-ink w-full rounded-xl border px-4 py-3 text-sm"
					value={stagedProvince?.id ?? ''}
					onchange={(e) => {
						const id = e.currentTarget.value;
						const found = provinces.find((p) => p.id === id);
						if (found) selectProvince(found);
					}}
				>
					<option value="">{m.lokasi_city_placeholder()}</option>
					{#each provinces as p (p.id)}
						<option value={p.id}>{p.name}</option>
					{/each}
				</select>
			</div>

			<!-- City -->
			<div>
				<label
					for="lokasi-city"
					class="text-ink-3 mb-1 block text-[11px] font-bold tracking-wide uppercase"
					>{m.lokasi_city_label()}</label
				>
				<select
					id="lokasi-city"
					class="border-line bg-paper text-ink w-full rounded-xl border px-4 py-3 text-sm"
					value={stagedCity?.id ?? ''}
					disabled={!stagedProvince || loadingCities}
					onchange={(e) => {
						const id = e.currentTarget.value;
						const found = cities.find((c) => c.id === id);
						if (found) {
							stagedMode = 'manual';
							stagedCity = found;
						}
					}}
				>
					<option value="">{loadingCities ? '...' : m.lokasi_city_placeholder()}</option>
					{#each cities as c (c.id)}
						<option value={c.id}>{c.name}</option>
					{/each}
				</select>
			</div>

			<!-- Save (form action for completion) -->
			<form
				method="POST"
				onsubmit={() => {
					if (!canSave) return false;
					handleCompletion();
					return true;
				}}
			>
				<input type="hidden" name="returnTo" value={data.returnTo} />
				<button
					type="submit"
					class="bg-ink text-paper mt-2 w-full rounded-xl py-3 text-sm font-semibold disabled:opacity-40"
					disabled={!canSave}
				>
					{m.lokasi_save()}
				</button>
			</form>

			{#if completionError}
				<p role="alert" class="text-center text-sm text-red-600">{m.lokasi_error_completion()}</p>
			{/if}
			{#if storageError}
				<p role="alert" class="text-center text-sm text-red-600">{m.lokasi_error_storage()}</p>
			{/if}

			<p class="text-ink-4 mt-2 text-center text-[11px] leading-relaxed">
				<b>Privasi:</b>
				{m.lokasi_privacy()}
			</p>
		</div>
	</div>

	<!-- ── Marker recovery ── -->
{:else if mode === 'marker-recovery'}
	<div class="mx-auto max-w-lg px-4 pt-10 pb-16">
		<div class="mb-6 flex flex-col items-center gap-2 text-center">
			<h1 class="text-ink text-2xl font-extrabold tracking-tight">{m.lokasi_recovery_title()}</h1>
		</div>
		<div class="bg-paper-2 border-line rounded-xl border p-4 text-center">
			<p class="text-ink text-sm font-semibold">{activeLabel}</p>
			<p class="text-ink-4 mt-1 text-xs">tersimpan sebelumnya</p>
		</div>
		<form method="POST" class="mt-4 flex flex-col gap-3" onsubmit={handleRecovery}>
			<input type="hidden" name="returnTo" value={data.returnTo} />
			<button
				type="submit"
				class="bg-orange text-paper w-full rounded-2xl py-3 text-sm font-semibold"
			>
				{m.lokasi_recovery_continue()}
			</button>
		</form>
		<p class="text-ink-4 mt-2 text-center text-xs">
			Hanya memulihkan penanda, tidak mengirim lokasi lagi
		</p>
		<div class="text-ink-4 my-3 flex items-center gap-3 text-xs">
			<hr class="border-line flex-1" />
			atau
			<hr class="border-line flex-1" />
		</div>
		<button
			class="border-line bg-paper-2 text-ink w-full rounded-xl border py-3 text-sm font-semibold"
			onclick={() => {}}
		>
			{m.lokasi_recovery_replace()}
		</button>
	</div>

	<!-- ── Replacement ── -->
{:else if mode === 'replacement'}
	<div class="mx-auto max-w-lg px-4 pt-6 pb-16">
		<div class="mb-6 flex flex-col items-center gap-2 text-center">
			<h1 class="text-ink text-2xl font-extrabold tracking-tight">{m.lokasi_replace_title()}</h1>
		</div>
		<div class="bg-paper-2 border-line mb-4 rounded-xl border p-3 text-center">
			<p class="text-ink-4 text-[11px]">Lokasi aktif</p>
			<p class="text-ink text-sm font-semibold">{activeLabel}</p>
		</div>

		<button
			class="bg-orange text-paper mb-3 flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold"
			onclick={activateGps}
			disabled={loc.requesting}
		>
			{m.lokasi_gps_button()}
		</button>

		<div class="text-ink-4 my-1 flex items-center gap-3 text-xs">
			<hr class="border-line flex-1" />
			{m.lokasi_manual_divider()}
			<hr class="border-line flex-1" />
		</div>

		<select
			class="border-line bg-paper text-ink mb-3 w-full rounded-xl border px-4 py-3 text-sm"
			value={stagedProvince?.id ?? ''}
			onchange={(e) => {
				const f = provinces.find((p) => p.id === e.currentTarget.value);
				if (f) selectProvince(f);
			}}
		>
			<option value="">{m.lokasi_city_placeholder()}</option>
			{#each provinces as p (p.id)}<option value={p.id}>{p.name}</option>{/each}
		</select>
		<select
			class="border-line bg-paper text-ink mb-3 w-full rounded-xl border px-4 py-3 text-sm"
			value={stagedCity?.id ?? ''}
			disabled={!stagedProvince}
			onchange={(e) => {
				const f = cities.find((c) => c.id === e.currentTarget.value);
				if (f) {
					stagedMode = 'manual';
					stagedCity = f;
				}
			}}
		>
			<option value="">{m.lokasi_city_placeholder()}</option>
			{#each cities as c (c.id)}<option value={c.id}>{c.name}</option>{/each}
		</select>

		<form
			method="POST"
			onsubmit={() => {
				if (!canSave) return false;
				handleCompletion();
				return true;
			}}
		>
			<input type="hidden" name="returnTo" value={data.returnTo} />
			<button
				type="submit"
				class="bg-orange text-paper mb-3 w-full rounded-2xl py-3 text-sm font-semibold disabled:opacity-40"
				disabled={!canSave}
			>
				{m.lokasi_save()}
			</button>
		</form>

		<button
			class="border-line bg-paper-2 text-ink w-full rounded-xl border py-3 text-sm font-semibold"
			onclick={handleCancel}
		>
			{m.lokasi_cancel()}
		</button>

		<p class="text-ink-4 mt-3 text-center text-[11px]">{m.lokasi_privacy()}</p>
	</div>
{/if}
