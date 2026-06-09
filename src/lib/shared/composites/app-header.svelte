<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '$core/i18n';
	import { BackButton } from '$lib/shared/primitives';
	import Button from '$shared/primitives/button.svelte';
	import { Settings } from '@lucide/svelte';
	import type { HeaderMode } from './header-mode';

	interface Props {
		mode?: HeaderMode;
		title?: string;
		onBack?: () => void;
		onsettingsclick?: () => void;
	}

	let {
		mode = 'home',
		title = '',
		onBack = () => history.back(),
		onsettingsclick = undefined
	}: Props = $props();
</script>

<header class="bg-surface sticky top-0 z-10 mx-auto flex h-14 max-w-2xl items-center gap-3 shadow">
	{#if mode === 'home'}
		<div class="flex w-full items-center justify-between gap-5 px-2">
			<a href={resolve('/')} class="flex items-baseline gap-1.5">
				<span class="text-primary font-serif text-xl font-bold">Qarib</span>
			</a>
			<button
				type="button"
				aria-label={m.nav_search_open()}
				class="border-border-2 bg-surface-2 text-content-3 flex h-10 flex-1 items-center gap-2 rounded-full border px-4 text-sm"
				onclick={() => {
					// TODO(Phase F): open /cari
				}}
			>
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="h-4 w-4 shrink-0"
					aria-hidden="true"
				>
					<circle cx="11" cy="11" r="8" />
					<path d="m21 21-4.35-4.35" />
				</svg>
				<span>{m.nav_search_placeholder()}</span>
			</button>
			<Button
				variant="ghost"
				size="sm"
				onclick={onsettingsclick}
				aria-label={m.setting_location_label()}><Settings size="18" /></Button
			>
		</div>
	{:else}
		<div class="flex w-full items-center gap-3 px-2">
			<BackButton onclick={onBack} class="h-10 w-10" />
			<h1 class="text-content font-medium">{title || 'Page Title'}</h1>
			<button
				type="button"
				class="flex h-8 w-8 items-center justify-center"
				onclick={onsettingsclick}
				aria-label={m.setting_location_label()}><Settings size="18" class="text-ink-3" /></button
			>
		</div>
	{/if}
</header>
