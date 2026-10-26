<script lang="ts">
	let { openLabel, closeLabel, links, ctaLabel, ctaHref }: {
		openLabel: string;
		closeLabel: string;
		links: { href: string; label: string }[];
		ctaLabel: string;
		ctaHref: string;
	} = $props();

	let open = $state(false);
</script>

<button
	type="button"
	class="text-content inline-flex h-10 w-10 items-center justify-center rounded-full border border-border sm:hidden"
	aria-expanded={open}
	aria-label={open ? closeLabel : openLabel}
	onclick={() => (open = !open)}
>
	{#if open}
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
	{:else}
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
	{/if}
</button>

{#if open}
	<div class="border-border bg-surface absolute inset-x-0 top-full border-b sm:hidden">
		<nav class="flex flex-col gap-1 px-6 py-4" aria-label="Menu">
			{#each links as link}
				<a
					href={link.href}
					class="text-content-2 rounded-lg px-3 py-2.5 text-base font-medium"
					onclick={() => (open = false)}
				>
					{link.label}
				</a>
			{/each}
			<a
				href={ctaHref}
				class="bg-primary mt-2 rounded-full px-5 py-3 text-center text-base font-semibold text-white"
				onclick={() => (open = false)}
			>
				{ctaLabel}
			</a>
		</nav>
	</div>
{/if}
