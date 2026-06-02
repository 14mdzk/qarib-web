<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		description?: string;
		icon?: Snippet;
		action?: Snippet;
	}

	let { title, description = '', icon, action }: Props = $props();
</script>

<div class="flex flex-col items-center gap-3 py-12 text-center">
	{#if icon}
		<div class="text-content-3">
			{@render icon()}
		</div>
	{/if}
	<p class="text-content font-medium">{title}</p>
	{#if description}
		<p class="text-content-3 text-sm">{description}</p>
	{/if}
	{#if action}
		<div class="mt-1">
			{@render action()}
		</div>
	{/if}
</div>
