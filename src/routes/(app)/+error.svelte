<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { m } from '$core/i18n';
	import { cn } from '$lib/shared/utils/cn';
	import { buttonClasses } from '$lib/shared/primitives/button-variants';
	import { Card } from '$lib/shared/primitives';
</script>

<div class="p-6">
	<Card>
		<h1 class="text-content font-serif text-xl italic">{m.error_generic_title()}</h1>
		<p class="text-content-2 mt-2">{page.error?.message ?? m.error_generic_body()}</p>
		{#if page.error?.requestId}<p class="text-content-4 mt-1 text-xs">
				{m.error_request_id({ id: page.error.requestId })}
			</p>{/if}
		<a href={resolve('/')} class={cn(buttonClasses({ variant: 'primary' }), 'mt-4 inline-flex')}
			>{m.error_back_home()}</a
		>
	</Card>
</div>
