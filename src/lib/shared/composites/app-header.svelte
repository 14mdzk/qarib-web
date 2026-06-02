<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '$core/i18n';
	import { BackButton } from '$lib/shared/primitives';
	import type { HeaderMode } from './header-mode';

	interface Props {
		mode?: HeaderMode;
		title?: string;
		onBack?: () => void;
	}

	let { mode = 'home', title = '', onBack = () => history.back() }: Props = $props();
</script>

<header
	class="border-border bg-surface sticky top-0 z-10 flex h-14 items-center gap-3 border-b px-4"
>
	{#if mode === 'home'}
		<a href={resolve('/')} class="flex items-baseline gap-1.5">
			<span class="text-primary font-serif text-xl font-bold">Qarib</span>
			<span class="font-arabic text-content-3 text-sm">قريب</span>
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
	{:else}
		<BackButton onclick={onBack} />
		<h1 class="text-content truncate font-medium">{title}</h1>
	{/if}
</header>
