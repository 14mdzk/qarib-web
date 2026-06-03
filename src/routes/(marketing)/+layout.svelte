<script lang="ts">
	import { resolve } from '$app/paths';
	import { buttonClasses } from '$lib/shared/primitives/button-variants.js';
	import { m } from '$core/i18n';

	let { children } = $props();
</script>

<header class="border-border bg-surface/95 sticky top-0 z-50 border-b backdrop-blur">
	<nav class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
		<a href={resolve('/')} class="flex items-baseline gap-1.5 no-underline">
			<span class="text-primary font-serif text-xl font-bold">{m.app_title()}</span>
			<span class="font-arabic text-content-3 text-sm">{m.app_title_ar()}</span>
		</a>
		<div class="flex items-center gap-6">
			<a
				href="#cara-kerja"
				class="text-content-2 hidden text-sm font-medium no-underline opacity-80 transition-opacity hover:opacity-100 sm:inline"
			>
				{m.landing_nav_how()}
			</a>
			<a
				href="#fitur"
				class="text-content-2 hidden text-sm font-medium no-underline opacity-80 transition-opacity hover:opacity-100 sm:inline"
			>
				{m.landing_nav_features()}
			</a>
			<a href={resolve('/peta')} class={buttonClasses({ variant: 'primary', size: 'sm' })}>
				{m.landing_nav_open()}
			</a>
		</div>
	</nav>
</header>

{@render children()}
